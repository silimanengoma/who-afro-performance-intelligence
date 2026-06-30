import { pool, withTransaction } from '../db.js';
import { SAM1_CYCLE_ID } from './selectionRules.js';
import {
  detectEscalationReason,
  groupCount,
  learningCategory,
  percentage,
  readinessIndicator,
  suggestedEscalationDestination
} from './countryRules.js';

async function countryRows() {
  const { rows } = await pool.query(
    `SELECT
       t.id AS team_id,
       t.name AS team_name,
       bc.id AS budget_centre_id,
       bc.code AS budget_centre_code,
       bc.name AS budget_centre_name,
       s.id AS selection_id,
       s.status AS selection_status,
       s.rank,
       ps.id AS product_service_id,
       ps.pe_name,
       ps.result_output,
       a.id AS assessment_id,
       a.status AS assessment_status,
       a.delivery_status,
       a.progress_percentage,
       a.data_confidence,
       a.contribution_narrative,
       a.contribution_strength,
       a.output_risk_flag,
       b.id AS bottleneck_id,
       b.category,
       b.description,
       b.severity,
       b.root_cause,
       b.proposed_corrective_action,
       b.responsible_person,
       b.target_deadline,
       b.support_required,
       b.escalation_required,
       b.escalation_level,
       b.action_status,
       b.status AS bottleneck_status
     FROM teams t
     JOIN budget_centres bc ON bc.id = t.budget_centre_id
     LEFT JOIN team_ps_selections s ON s.team_id = t.id AND s.sam1_cycle_id = $1
     LEFT JOIN products_services ps ON ps.id = s.product_service_id
     LEFT JOIN ps_assessments a ON a.selection_id = s.id AND a.sam1_cycle_id = s.sam1_cycle_id
     LEFT JOIN bottlenecks b ON b.assessment_id = a.id AND b.sam1_cycle_id = a.sam1_cycle_id
     ORDER BY bc.code, t.name, s.rank`,
    [SAM1_CYCLE_ID]
  );
  return rows;
}

function uniqueBy(items, key) {
  return [...new Map(items.filter((item) => item[key]).map((item) => [item[key], item])).values()];
}

function baseRecords(rows) {
  const selections = uniqueBy(rows, 'selection_id');
  const assessments = uniqueBy(rows, 'assessment_id');
  const bottlenecks = uniqueBy(rows, 'bottleneck_id');
  const teams = uniqueBy(rows, 'team_id');
  return { selections, assessments, bottlenecks, teams };
}

function teamComplete(teamId, rows) {
  const teamRows = rows.filter((row) => row.team_id === teamId);
  const selections = uniqueBy(teamRows, 'selection_id');
  const assessments = uniqueBy(teamRows, 'assessment_id');
  const delayedAssessments = assessments.filter((item) => ['Delayed', 'At risk', 'Not started'].includes(item.delivery_status));
  const hasCompleteSelection = selections.length > 0 && selections.every((item) => item.selection_status === 'completed');
  const hasCompleteAssessments = selections.length > 0 && assessments.length === selections.length && assessments.every((item) => item.assessment_status === 'complete');
  const hasBottleneckReview = delayedAssessments.every((assessment) =>
    teamRows.some((row) => row.assessment_id === assessment.assessment_id && row.bottleneck_status === 'complete')
  );
  return hasCompleteSelection && hasCompleteAssessments && hasBottleneckReview;
}

export function buildCountryIntelligence(rows) {
  const { assessments, bottlenecks, teams } = baseRecords(rows);
  const completedTeams = teams.filter((team) => teamComplete(team.team_id, rows)).length;
  const correctiveActions = bottlenecks.filter((item) => item.proposed_corrective_action);
  const escalationCandidates = bottlenecks
    .filter((item) => item.escalation_required || ['High', 'Critical'].includes(item.severity))
    .map((item) => ({
      id: item.bottleneck_id,
      teamId: item.team_id,
      teamName: item.team_name,
      productServiceId: item.product_service_id,
      productServiceName: item.pe_name,
      output: item.result_output,
      severity: item.severity,
      category: item.category,
      reason: detectEscalationReason({
        escalationRequired: item.escalation_required,
        severity: item.severity
      }),
      suggestedDestination: suggestedEscalationDestination({
        escalationLevel: item.escalation_level,
        supportRequired: item.support_required
      })
    }));

  const readiness = {
    teamsParticipating: teams.length,
    teamsCompleted: completedTeams,
    teamsInProgress: Math.max(teams.length - completedTeams, 0),
    assessedProductsServices: assessments.length,
    completedAssessments: assessments.filter((item) => item.assessment_status === 'complete').length,
    bottlenecks: bottlenecks.length,
    correctiveActions: correctiveActions.length,
    escalationCandidates: escalationCandidates.length,
    readinessIndicator: readinessIndicator({ teamsParticipating: teams.length, teamsCompleted: completedTeams }),
    completionPercentage: percentage(completedTeams, teams.length)
  };

  const delivery = {
    totalAssessed: assessments.length,
    distribution: groupCount(assessments, (item) => item.delivery_status),
    byTeam: groupCount(assessments, (item) => item.team_name),
    byBudgetCentre: groupCount(assessments, (item) => item.budget_centre_code),
    byOutput: groupCount(assessments, (item) => item.result_output)
  };

  const outputMap = new Map();
  for (const assessment of assessments) {
    const key = assessment.result_output || 'Unspecified';
    const current = outputMap.get(key) ?? {
      output: key,
      contributingProductsServices: 0,
      strengths: {},
      risks: {},
      strongestEvidence: 0,
      affectedByBottlenecks: 0,
      trace: []
    };
    current.contributingProductsServices += 1;
    current.strengths[assessment.contribution_strength || 'Unspecified'] = (current.strengths[assessment.contribution_strength || 'Unspecified'] ?? 0) + 1;
    current.risks[assessment.output_risk_flag || 'Unknown'] = (current.risks[assessment.output_risk_flag || 'Unknown'] ?? 0) + 1;
    if (assessment.data_confidence === 'Confirmed') current.strongestEvidence += 1;
    current.trace.push({ teamId: assessment.team_id, assessmentId: assessment.assessment_id, productServiceId: assessment.product_service_id });
    outputMap.set(key, current);
  }
  for (const bottleneck of bottlenecks) {
    const key = bottleneck.result_output || 'Unspecified';
    const current = outputMap.get(key);
    if (current) current.affectedByBottlenecks += 1;
  }

  const learningCounts = {};
  const learningEvidence = {};
  for (const row of [...assessments, ...bottlenecks]) {
    const category = learningCategory({
      category: row.category,
      description: row.description || row.contribution_narrative,
      rootCause: row.root_cause,
      severity: row.severity,
      deliveryStatus: row.delivery_status,
      contributionStrength: row.contribution_strength
    });
    learningCounts[category] = (learningCounts[category] ?? 0) + 1;
    learningEvidence[category] = learningEvidence[category] ?? [];
    learningEvidence[category].push({
      teamId: row.team_id,
      assessmentId: row.assessment_id,
      bottleneckId: row.bottleneck_id,
      productServiceId: row.product_service_id
    });
  }
  const learnings = Object.entries(learningCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([category, count]) => ({
      category,
      theme: `${category} observed across ${count} submission${count === 1 ? '' : 's'}`,
      count,
      evidence: learningEvidence[category]
    }));

  const bottleneckIntelligence = {
    count: bottlenecks.length,
    byCategory: groupCount(bottlenecks, (item) => item.category),
    bySeverity: groupCount(bottlenecks, (item) => item.severity),
    highCritical: bottlenecks.filter((item) => ['High', 'Critical'].includes(item.severity)),
    heatmap: groupCount(bottlenecks, (item) => `${item.team_name} / ${item.category || 'Unspecified'}`)
  };

  const correctiveActionIntelligence = correctiveActions.map((item) => ({
    id: item.bottleneck_id,
    action: item.proposed_corrective_action,
    responsible: item.responsible_person,
    deadline: item.target_deadline,
    productServiceName: item.pe_name,
    output: item.result_output,
    priority: item.severity,
    supportRequired: item.support_required,
    status: item.action_status,
    group: item.support_required === 'None' || item.support_required === 'Country Office leadership' ? 'Country action' : item.support_required === 'Cluster' ? 'Cluster action' : 'Regional action',
    trace: { teamId: item.team_id, assessmentId: item.assessment_id, bottleneckId: item.bottleneck_id, productServiceId: item.product_service_id }
  }));

  const outputIntelligence = [...outputMap.values()].sort((a, b) => b.affectedByBottlenecks - a.affectedByBottlenecks);
  const recommendedDecisions = escalationCandidates.slice(0, 10).map((item) => ({
    issue: `${item.severity} ${item.category} bottleneck affecting ${item.productServiceName}`,
    recommendation: `Escalate to ${item.suggestedDestination} for decision or support.`,
    trace: { teamId: item.teamId, productServiceId: item.productServiceId, bottleneckId: item.id }
  }));

  return {
    sam1CycleId: SAM1_CYCLE_ID,
    readiness,
    delivery,
    outputIntelligence,
    bottleneckIntelligence,
    correctiveActionIntelligence,
    escalationCandidates,
    learnings,
    decisionLog: recommendedDecisions
  };
}

export async function countryIntelligence() {
  return buildCountryIntelligence(await countryRows());
}

export async function countryDelivery() {
  return (await countryIntelligence()).delivery;
}

export async function countryOutputIntelligence() {
  return { outputs: (await countryIntelligence()).outputIntelligence };
}

export async function countryBottlenecks() {
  return (await countryIntelligence()).bottleneckIntelligence;
}

export async function countryEscalations() {
  return { escalationCandidates: (await countryIntelligence()).escalationCandidates };
}

export async function countryLearnings() {
  return { learningThemes: (await countryIntelligence()).learnings };
}

export function draftExecutiveSummary(intelligence) {
  const topRisk = intelligence.escalationCandidates[0];
  const topOutput = intelligence.outputIntelligence[0];
  const priorityActions = intelligence.correctiveActionIntelligence.slice(0, 5).map((item) => `- ${item.action} (${item.responsible || 'owner pending'})`).join('\n');
  return [
    `Overall country performance: ${intelligence.readiness.readinessIndicator} with ${intelligence.readiness.completionPercentage}% team readiness.`,
    `Major achievements: ${intelligence.delivery.distribution.Completed ?? 0} assessed Products & Services are completed, and ${topOutput?.output ?? 'no output yet'} has the strongest consolidated evidence.`,
    `Major risks: ${intelligence.bottleneckIntelligence.highCritical.length} high or critical bottlenecks require management attention.`,
    `Outputs at risk: ${intelligence.outputIntelligence.filter((item) => item.risks['At risk'] || item.risks['Off track']).map((item) => item.output).slice(0, 5).join(', ') || 'None captured yet'}.`,
    `Most significant bottlenecks: ${topRisk ? `${topRisk.severity} ${topRisk.category} affecting ${topRisk.productServiceName}` : 'No escalation candidates yet'}.`,
    `Priority corrective actions:\n${priorityActions || '- No corrective actions proposed yet.'}`,
    `Recommended WR decisions: ${intelligence.decisionLog.map((item) => item.recommendation).slice(0, 3).join(' ') || 'No decisions proposed yet.'}`,
    `Suggested Regional support: ${intelligence.escalationCandidates.filter((item) => ['Regional Office', 'MSC', 'DPM'].includes(item.suggestedDestination)).map((item) => item.suggestedDestination).slice(0, 5).join(', ') || 'No regional support request captured yet'}.`
  ].join('\n\n');
}

export async function getExecutiveSummary() {
  const { rows } = await pool.query(
    'SELECT * FROM executive_summaries WHERE sam1_cycle_id = $1 ORDER BY updated_at DESC LIMIT 1',
    [SAM1_CYCLE_ID]
  );
  if (rows[0]) return rows[0].content;
  return draftExecutiveSummary(await countryIntelligence());
}

export async function saveExecutiveSummary(content, userId) {
  const { rows } = await pool.query(
    `INSERT INTO executive_summaries (sam1_cycle_id, content, edited_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [SAM1_CYCLE_ID, content, userId]
  );
  return rows[0];
}

function reviewPackHtml(intelligence, summary) {
  const section = (title, body) => `<section><h2>${title}</h2>${body}</section>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Country SAM 1 Review Pack</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#17211d}section{border-top:1px solid #d7ded6;padding-top:18px;margin-top:18px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #dce3da;padding:8px;text-align:left}.risk{color:#9b271b;font-weight:bold}</style></head><body><h1>Country SAM 1 Review Pack</h1>${
    section('1 Executive Summary', `<pre>${summary}</pre>`) +
    section('2 Delivery Dashboard', `<p>Total assessed P/S: ${intelligence.delivery.totalAssessed}</p><pre>${JSON.stringify(intelligence.delivery.distribution, null, 2)}</pre>`) +
    section('3 Output Dashboard', `<pre>${JSON.stringify(intelligence.outputIntelligence.slice(0, 10), null, 2)}</pre>`) +
    section('4 Bottleneck Dashboard', `<pre>${JSON.stringify(intelligence.bottleneckIntelligence, null, 2)}</pre>`) +
    section('5 Corrective Action Summary', `<pre>${JSON.stringify(intelligence.correctiveActionIntelligence, null, 2)}</pre>`) +
    section('6 Escalation Summary', `<pre>${JSON.stringify(intelligence.escalationCandidates, null, 2)}</pre>`) +
    section('7 Learning Summary', `<pre>${JSON.stringify(intelligence.learnings, null, 2)}</pre>`) +
    section('8 Proposed Decision Log', `<pre>${JSON.stringify(intelligence.decisionLog, null, 2)}</pre>`)
  }</body></html>`;
}

export async function countryReviewPack(userId) {
  return withTransaction(async (db) => {
    const intelligence = await countryIntelligence();
    const summary = await getExecutiveSummary();
    const versionRows = await db.query('SELECT COALESCE(MAX(version), 0) + 1 AS version FROM country_reviews WHERE sam1_cycle_id = $1', [SAM1_CYCLE_ID]);
    const reviewRows = await db.query(
      `INSERT INTO country_reviews (sam1_cycle_id, version, status, generated_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [SAM1_CYCLE_ID, versionRows.rows[0].version, intelligence.readiness.readinessIndicator, userId]
    );
    const review = reviewRows.rows[0];
    await db.query(
      `INSERT INTO review_readiness (
        review_id, teams_participating, teams_completed, teams_in_progress,
        assessed_products_services, completed_assessments, bottlenecks,
        corrective_actions, escalation_candidates, readiness_indicator
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        review.id,
        intelligence.readiness.teamsParticipating,
        intelligence.readiness.teamsCompleted,
        intelligence.readiness.teamsInProgress,
        intelligence.readiness.assessedProductsServices,
        intelligence.readiness.completedAssessments,
        intelligence.readiness.bottlenecks,
        intelligence.readiness.correctiveActions,
        intelligence.readiness.escalationCandidates,
        intelligence.readiness.readinessIndicator
      ]
    );
    await db.query('INSERT INTO country_intelligence_snapshots (review_id, snapshot) VALUES ($1, $2)', [review.id, intelligence]);
    await db.query('INSERT INTO country_summary (review_id, summary) VALUES ($1, $2)', [review.id, { executiveSummary: summary, decisionLog: intelligence.decisionLog }]);
    for (const learning of intelligence.learnings) {
      await db.query(
        'INSERT INTO learning_clusters (review_id, category, theme, evidence) VALUES ($1, $2, $3, $4)',
        [review.id, learning.category, learning.theme, learning.evidence]
      );
    }
    const html = reviewPackHtml(intelligence, summary);
    return {
      reviewId: review.id,
      version: review.version,
      formats: {
        html,
        pdf: html,
        docx: html
      },
      note: 'PDF and DOCX are generated as portable HTML payloads in this MVP and can be rendered/exported by the client or reporting service.'
    };
  });
}
