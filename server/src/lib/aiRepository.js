import { pool, withTransaction } from '../db.js';
import { countryIntelligence } from './countryRepository.js';
import { regionalDashboard, regionalExecutiveSummary } from './regionalRepository.js';
import { labelDraft, estimateTokens, requireCitations, providerConfig, enforceRoleScope } from './aiRules.js';

async function activePrompt(templateKey) {
  const { rows } = await pool.query(
    'SELECT * FROM ai_prompt_templates WHERE template_key = $1 AND active = true ORDER BY version DESC LIMIT 1',
    [templateKey]
  );
  if (!rows.length) throw Object.assign(new Error(`Prompt template not found: ${templateKey}`), { status: 404 });
  return rows[0];
}

function citation(entityType, entityId, label, fields = []) {
  return { entityType, entityId, label, fields };
}

function mockProviderGenerate({ serviceName, template, context, citations, question, audience }) {
  const facts = citations.map((item) => `- ${item.label}`).slice(0, 8).join('\n') || '- No structured evidence available';
  const inference = serviceName.includes('decision') ? 'Suggested actions should be reviewed by the responsible manager before adoption.' :
    serviceName.includes('root') ? 'Root causes are hypotheses unless confirmed by the team.' :
      'Interpretation is based only on the cited structured fields.';
  return {
    provider: providerConfig().activeProvider,
    content: labelDraft([
      `${template.title}${audience ? ` for ${audience}` : ''}`,
      question ? `Question: ${question}` : null,
      'Facts used:',
      facts,
      `Inference: ${inference}`,
      'Suggested next step: Review, edit, and validate this draft before use.'
    ].filter(Boolean).join('\n\n')),
    citations,
    facts: citations,
    inferences: [inference],
    confidence: citations.length ? 'medium' : 'low',
    contextSummary: Object.keys(context ?? {}).join(', ')
  };
}

async function auditAndStore({ serviceName, template, userId, context, citations, output, entityType = 'ai_session', entityId = null, outputType }) {
  requireCitations(citations);
  return withTransaction(async (db) => {
    const audit = await db.query(
      `INSERT INTO ai_audit_logs (
        service_name, provider, prompt_template_key, prompt_version, requested_by,
        input_context, data_sources, output, token_estimate
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        serviceName,
        output.provider,
        template.template_key,
        template.version,
        userId,
        context,
        citations,
        output,
        estimateTokens({ context, output })
      ]
    );
    const generated = await db.query(
      `INSERT INTO ai_generated_outputs (
        audit_log_id, entity_type, entity_id, output_type, content, citations, status
      ) VALUES ($1,$2,$3,$4,$5,$6,'draft') RETURNING *`,
      [audit.rows[0].id, entityType, entityId, outputType, output.content, citations]
    );
    return { auditLog: audit.rows[0], generatedOutput: generated.rows[0], output };
  });
}

async function assessmentContext(assessmentId, user) {
  const scope = enforceRoleScope(user);
  const { rows } = await pool.query(
    `SELECT a.*, ps.pe_name, ps.result_output, t.name AS team_name, bc.code AS centre_code
     FROM ps_assessments a
     JOIN products_services ps ON ps.id = a.product_service_id
     JOIN teams t ON t.id = a.team_id
     JOIN budget_centres bc ON bc.id = a.budget_centre_id
     WHERE a.id = $1 AND ($2::text IS NULL OR bc.code = $2)`,
    [assessmentId, scope.centreCode ?? null]
  );
  if (!rows.length) throw Object.assign(new Error('Assessment not found or not authorized.'), { status: 404 });
  const row = rows[0];
  return {
    context: row,
    citations: [
      citation('ps_assessment', row.id, `Assessment for ${row.pe_name}`, ['delivery_status', 'progress_percentage', 'planned_deliverable', 'actual_deliverable']),
      citation('products_services', row.product_service_id, `Related GPW14 Output: ${row.result_output}`, ['result_output'])
    ]
  };
}

async function bottleneckContext(assessmentId, user) {
  const scope = enforceRoleScope(user);
  const { rows } = await pool.query(
    `SELECT b.*, ps.pe_name, t.name AS team_name, bc.code AS centre_code
     FROM bottlenecks b
     JOIN products_services ps ON ps.id = b.product_service_id
     JOIN teams t ON t.id = b.team_id
     JOIN budget_centres bc ON bc.id = b.budget_centre_id
     WHERE b.assessment_id = $1 AND ($2::text IS NULL OR bc.code = $2)
     ORDER BY b.created_at`,
    [assessmentId, scope.centreCode ?? null]
  );
  return {
    context: { bottlenecks: rows },
    citations: rows.map((row) => citation('bottleneck', row.id, `${row.severity} ${row.category}: ${row.description}`, ['category', 'severity', 'root_cause', 'proposed_corrective_action']))
  };
}

export async function generateAssessmentNarrative(assessmentId, user) {
  const template = await activePrompt('assessment_narrative');
  const { context, citations } = await assessmentContext(assessmentId, user);
  const output = mockProviderGenerate({ serviceName: 'narrative_generation', template, context, citations });
  return auditAndStore({ serviceName: 'narrative_generation', template, userId: user.sub, context, citations, output, entityType: 'ps_assessment', entityId: assessmentId, outputType: 'assessment_narrative' });
}

export async function analyzeBottlenecks(assessmentId, user) {
  const template = await activePrompt('bottleneck_summary');
  const { context, citations } = await bottleneckContext(assessmentId, user);
  const safeCitations = citations.length ? citations : [citation('ps_assessment', assessmentId, 'Assessment has no bottlenecks recorded yet', ['assessment_id'])];
  const output = mockProviderGenerate({ serviceName: 'root_cause_suggestion', template, context, citations: safeCitations });
  return auditAndStore({ serviceName: 'root_cause_suggestion', template, userId: user.sub, context, citations: safeCitations, output, entityType: 'ps_assessment', entityId: assessmentId, outputType: 'bottleneck_analysis' });
}

export async function recommendDecision(body, user) {
  const template = await activePrompt('decision_recommendation');
  const context = { issue: body.issue, level: body.level, evidence: body.evidence ?? [] };
  const citations = (body.evidence ?? []).map((item, index) => citation(item.entityType ?? 'manual_evidence', item.entityId ?? null, item.label ?? `Evidence ${index + 1}`, item.fields ?? []));
  const safeCitations = citations.length ? citations : [citation('manual_issue', null, body.issue ?? 'Decision issue provided by user', ['issue'])];
  const output = mockProviderGenerate({ serviceName: 'decision_recommendation', template, context, citations: safeCitations });
  return auditAndStore({ serviceName: 'decision_recommendation', template, userId: user.sub, context, citations: safeCitations, output, outputType: 'decision_recommendation' });
}

export async function synthesizeLearning(user) {
  const template = await activePrompt('learning_synthesis');
  const regional = await regionalDashboard();
  const citations = Object.keys(regional.learningClusters ?? {}).map((key) => citation('validated_learning_themes', null, `${key}: ${regional.learningClusters[key]} validated theme(s)`, ['category']));
  const safeCitations = citations.length ? citations : [citation('regional_dashboard', null, 'Regional learning dashboard has no themes yet', ['learningClusters'])];
  const output = mockProviderGenerate({ serviceName: 'learning_synthesis', template, context: regional.learningClusters, citations: safeCitations });
  return auditAndStore({ serviceName: 'learning_synthesis', template, userId: user.sub, context: regional.learningClusters, citations: safeCitations, output, outputType: 'learning_synthesis' });
}

export async function generateExecutiveBriefing(audience, user) {
  const template = await activePrompt('executive_briefing');
  const [country, regionalSummary] = await Promise.all([countryIntelligence(), regionalExecutiveSummary()]);
  const context = { audience, countryReadiness: country.readiness, regionalSummary };
  const citations = [
    citation('country_intelligence', null, `Country readiness: ${country.readiness.readinessIndicator}`, ['readiness']),
    citation('regional_intelligence', null, 'Regional executive summary', ['content'])
  ];
  const output = mockProviderGenerate({ serviceName: 'executive_briefing', template, context, citations, audience });
  return auditAndStore({ serviceName: 'executive_briefing', template, userId: user.sub, context, citations, output, outputType: `${audience}_briefing` });
}

export async function detectRegionalPatterns(user) {
  const template = await activePrompt('regional_patterns');
  const regional = await regionalDashboard();
  const citations = [
    citation('regional_dashboard', null, `Executive signal: ${regional.executiveSignal}`, ['executiveSignal']),
    citation('regional_dashboard', null, `Escalation queue: ${regional.escalationQueue.length}`, ['escalationQueue'])
  ];
  const output = mockProviderGenerate({ serviceName: 'regional_intelligence', template, context: regional, citations });
  return auditAndStore({ serviceName: 'regional_intelligence', template, userId: user.sub, context: regional, citations, output, outputType: 'regional_patterns' });
}

export async function answerQuestion(question, user) {
  const template = await activePrompt('qa_response');
  const [country, regional] = await Promise.all([countryIntelligence(), regionalDashboard()]);
  const lower = String(question ?? '').toLowerCase();
  let context = { question, countryReadiness: country.readiness, regionalSignal: regional.executiveSignal };
  let citations = [citation('country_intelligence', null, 'Country Intelligence Workspace', ['readiness']), citation('regional_dashboard', null, 'Regional dashboard', ['executiveSignal'])];
  if (lower.includes('procurement')) {
    context = { ...context, procurement: regional.bottleneckHeatmap };
    citations.push(citation('bottlenecks', null, 'Regional bottleneck heatmap filtered for procurement', ['category']));
  }
  if (lower.includes('overdue') || lower.includes('decision')) {
    context = { ...context, decisions: regional.decisionTracker };
    citations.push(citation('final_decision_logs', null, 'Regional decision tracker', ['status', 'deadline']));
  }
  const output = mockProviderGenerate({ serviceName: 'question_answering', template, context, citations, question });
  return auditAndStore({ serviceName: 'question_answering', template, userId: user.sub, context, citations, output, outputType: 'qa_response' });
}

export async function listAiAuditLogs() {
  const { rows } = await pool.query('SELECT * FROM ai_audit_logs ORDER BY created_at DESC LIMIT 50');
  return rows;
}

export async function updateGeneratedOutput(id, body, userId) {
  const { rows } = await pool.query(
    `UPDATE ai_generated_outputs
     SET user_edits = $1, status = $2, approved_by = CASE WHEN $2 = 'approved' THEN $3 ELSE approved_by END,
         approved_at = CASE WHEN $2 = 'approved' THEN now() ELSE approved_at END,
         updated_at = now()
     WHERE id = $4
     RETURNING *`,
    [body.userEdits ?? null, body.status ?? 'draft', userId, id]
  );
  if (!rows.length) throw Object.assign(new Error('AI generated output not found.'), { status: 404 });
  return rows[0];
}

export async function promptTemplates() {
  const { rows } = await pool.query('SELECT template_key, version, title, active FROM ai_prompt_templates ORDER BY template_key, version DESC');
  return rows;
}
