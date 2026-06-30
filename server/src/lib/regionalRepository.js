import { pool } from '../db.js';
import { SAM1_CYCLE_ID } from './selectionRules.js';
import { calculateRegionalKpis, executiveSignal, groupCount, kpiMethodologies } from './regionalRules.js';

async function regionalSourceRows() {
  const [submissions, assessments, bottlenecks, decisions, learnings, supportActions] = await Promise.all([
    pool.query(
      `SELECT sl.*, crm.id AS meeting_id, bc.code AS country_code, bc.name AS country_name
       FROM submission_locks sl
       JOIN country_review_meetings crm ON crm.id = sl.meeting_id
       LEFT JOIN budget_centres bc ON bc.id = crm.budget_centre_id
       WHERE crm.sam1_cycle_id = $1`,
      [SAM1_CYCLE_ID]
    ),
    pool.query(
      `SELECT a.*, t.name AS team_name, bc.code AS country_code, bc.name AS country_name, ps.pe_name
       FROM ps_assessments a
       JOIN teams t ON t.id = a.team_id
       JOIN budget_centres bc ON bc.id = a.budget_centre_id
       JOIN products_services ps ON ps.id = a.product_service_id
       WHERE a.sam1_cycle_id = $1`,
      [SAM1_CYCLE_ID]
    ),
    pool.query(
      `SELECT b.*, t.name AS team_name, bc.code AS country_code, bc.name AS country_name, ps.pe_name
       FROM bottlenecks b
       JOIN teams t ON t.id = b.team_id
       JOIN budget_centres bc ON bc.id = b.budget_centre_id
       JOIN products_services ps ON ps.id = b.product_service_id
       WHERE b.sam1_cycle_id = $1`,
      [SAM1_CYCLE_ID]
    ),
    pool.query(
      `SELECT d.*, crm.sam1_cycle_id, bc.code AS country_code, bc.name AS country_name
       FROM final_decision_logs d
       JOIN country_review_meetings crm ON crm.id = d.meeting_id
       LEFT JOIN budget_centres bc ON bc.id = crm.budget_centre_id
       WHERE crm.sam1_cycle_id = $1`,
      [SAM1_CYCLE_ID]
    ),
    pool.query(
      `SELECT l.*, crm.sam1_cycle_id, bc.code AS country_code, bc.name AS country_name
       FROM validated_learning_themes l
       JOIN country_review_meetings crm ON crm.id = l.meeting_id
       LEFT JOIN budget_centres bc ON bc.id = crm.budget_centre_id
       WHERE crm.sam1_cycle_id = $1 AND l.accepted = true`,
      [SAM1_CYCLE_ID]
    ),
    pool.query('SELECT * FROM regional_support_actions WHERE sam1_cycle_id = $1', [SAM1_CYCLE_ID])
  ]);
  return {
    submissions: submissions.rows,
    assessments: assessments.rows,
    bottlenecks: bottlenecks.rows,
    decisions: decisions.rows,
    learnings: learnings.rows,
    supportActions: supportActions.rows
  };
}

function countryCode(row) {
  return row.country_code || 'REG';
}

export async function regionalDashboard() {
  const source = await regionalSourceRows();
  const kpis = calculateRegionalKpis(source);
  return {
    sam1CycleId: SAM1_CYCLE_ID,
    executiveSignal: executiveSignal(kpis),
    submissions: {
      countriesSubmitted: source.submissions.length,
      countriesPending: Math.max(47 - source.submissions.length, 0),
      lockedSubmissions: source.submissions.length,
      versionHistory: source.submissions.map((item) => ({
        countryCode: countryCode(item),
        countryName: item.country_name || 'Regional consolidated submission',
        version: item.version,
        lockedAt: item.locked_at
      }))
    },
    kpis,
    methodologies: kpiMethodologies(),
    deliveryHeatmap: groupCount(source.assessments, (item) => `${countryCode(item)} / ${item.delivery_status}`),
    outputIntelligence: groupCount(source.assessments, (item) => item.result_output),
    bottleneckHeatmap: groupCount(source.bottlenecks, (item) => `${countryCode(item)} / ${item.category}`),
    escalationQueue: source.bottlenecks.filter((item) => item.escalation_required || ['High', 'Critical'].includes(item.severity)),
    decisionTracker: source.decisions,
    learningClusters: groupCount(source.learnings, (item) => item.category)
  };
}

export async function regionalCountries() {
  const source = await regionalSourceRows();
  const countries = new Map();
  for (const row of [...source.assessments, ...source.bottlenecks, ...source.decisions, ...source.submissions]) {
    const code = countryCode(row);
    const current = countries.get(code) ?? {
      code,
      name: row.country_name || 'Regional consolidated submission',
      assessments: 0,
      bottlenecks: 0,
      decisions: 0,
      submitted: false
    };
    if (row.delivery_status) current.assessments += 1;
    if (row.category && row.severity) current.bottlenecks += 1;
    if (row.decision) current.decisions += 1;
    if (row.locked_at) current.submitted = true;
    countries.set(code, current);
  }
  return { countries: [...countries.values()] };
}

export async function regionalOutputs() {
  const source = await regionalSourceRows();
  return {
    outputs: Object.entries(groupCount(source.assessments, (item) => item.result_output)).map(([output, count]) => ({
      output,
      count,
      riskCount: source.assessments.filter((item) => item.result_output === output && ['At risk', 'Off track'].includes(item.output_risk_flag)).length,
      countries: [...new Set(source.assessments.filter((item) => item.result_output === output).map(countryCode))]
    }))
  };
}

export async function regionalBottlenecks() {
  const source = await regionalSourceRows();
  return {
    byCategory: groupCount(source.bottlenecks, (item) => item.category),
    bySeverity: groupCount(source.bottlenecks, (item) => item.severity),
    mostCommon: Object.entries(groupCount(source.bottlenecks, (item) => item.category)).sort((a, b) => b[1] - a[1]).slice(0, 10),
    highCritical: source.bottlenecks.filter((item) => ['High', 'Critical'].includes(item.severity))
  };
}

export async function regionalEscalations() {
  const source = await regionalSourceRows();
  return {
    escalations: source.bottlenecks.filter((item) => item.escalation_required || ['High', 'Critical'].includes(item.severity)).map((item) => ({
      id: item.id,
      countryCode: countryCode(item),
      teamName: item.team_name,
      productServiceName: item.pe_name,
      output: item.result_output,
      severity: item.severity,
      category: item.category,
      escalationLevel: item.escalation_level || item.support_required || 'WR'
    }))
  };
}

export async function regionalLearnings() {
  const source = await regionalSourceRows();
  return {
    learningThemes: Object.entries(groupCount(source.learnings, (item) => item.category)).map(([category, count]) => ({
      category,
      count,
      countries: [...new Set(source.learnings.filter((item) => item.category === category).map(countryCode))]
    })),
    goodPracticeLibrary: source.learnings.filter((item) => ['Good practice', 'Good practices', 'Innovation', 'Innovations'].includes(item.category)),
    exchangeRecommendations: source.learnings.slice(0, 10).map((item) => ({
      fromCountry: countryCode(item),
      theme: item.theme,
      recommendedAudience: 'Countries with similar bottleneck profile'
    }))
  };
}

export async function regionalDecisionTracker() {
  const source = await regionalSourceRows();
  const now = new Date();
  return {
    decisions: source.decisions.map((item) => ({
      id: item.id,
      countryCode: countryCode(item),
      issue: item.issue,
      output: item.result_output,
      responsibleRole: item.responsible_person,
      status: item.status,
      dueDate: item.deadline,
      overdue: item.deadline ? new Date(item.deadline) < now && !['Completed', 'Approved'].includes(item.status) : false,
      escalationRequired: item.escalation_required
    })),
    summary: {
      total: source.decisions.length,
      completed: source.decisions.filter((item) => ['Completed', 'Approved'].includes(item.status)).length,
      escalated: source.decisions.filter((item) => item.escalation_required).length
    }
  };
}

export async function regionalExecutiveSummary() {
  const dashboard = await regionalDashboard();
  return {
    content: [
      `Regional performance signal: ${dashboard.executiveSignal}.`,
      `${dashboard.submissions.countriesSubmitted} country submissions are locked; ${dashboard.submissions.countriesPending} remain pending against the 47-country target.`,
      `Delivery Acceleration Index is ${dashboard.kpis.deliveryAccelerationIndex}%. Country Risk Score is ${dashboard.kpis.countryRiskScore}.`,
      `Most common bottleneck pattern: ${Object.entries(dashboard.bottleneckHeatmap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None captured yet'}.`,
      `Escalation queue contains ${dashboard.escalationQueue.length} candidate issue(s).`
    ].join('\n\n')
  };
}

export async function regionalMecBriefing() {
  const [dashboard, summary, decisions, learnings] = await Promise.all([
    regionalDashboard(),
    regionalExecutiveSummary(),
    regionalDecisionTracker(),
    regionalLearnings()
  ]);
  return {
    title: 'MEC Regional SAM 1 Briefing',
    executiveSummary: summary.content,
    heatmaps: {
      delivery: dashboard.deliveryHeatmap,
      bottlenecks: dashboard.bottleneckHeatmap
    },
    priorityDecisions: decisions.decisions.filter((item) => item.escalationRequired || item.overdue).slice(0, 10),
    learningHighlights: learnings.learningThemes.slice(0, 10),
    formats: {
      powerpoint: 'MVP briefing payload; render into PPTX in the presentation service.',
      pdf: 'MVP briefing payload; render into PDF in the document service.',
      word: 'MVP briefing payload; render into DOCX in the document service.'
    }
  };
}

export async function createRegionalIntelligenceNote(body, userId) {
  const { rows } = await pool.query(
    `INSERT INTO regional_intelligence_notes (sam1_cycle_id, audience, title, content, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [SAM1_CYCLE_ID, body.audience ?? 'MSC', body.title ?? 'Regional Intelligence Note', body.content ?? '', userId]
  );
  return rows[0];
}
