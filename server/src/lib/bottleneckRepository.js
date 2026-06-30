import { pool, withTransaction } from '../db.js';
import { SAM1_CYCLE_ID } from './selectionRules.js';
import {
  bottleneckWarnings,
  highestSeverity,
  normalizeBottleneckInput,
  validateBottleneckComplete,
  validateBottleneckDraft
} from './bottleneckRules.js';

function rowToBottleneck(row) {
  return {
    id: row.id,
    sam1CycleId: row.sam1_cycle_id,
    budgetCentreId: row.budget_centre_id,
    teamId: row.team_id,
    assessmentId: row.assessment_id,
    productServiceId: row.product_service_id,
    productServiceName: row.pe_name,
    resultOutput: row.result_output,
    category: row.category,
    description: row.description,
    severity: row.severity,
    rootCause: row.root_cause,
    consequenceForDelivery: row.consequence_for_delivery,
    proposedCorrectiveAction: row.proposed_corrective_action,
    responsiblePerson: row.responsible_person,
    targetDeadline: row.target_deadline,
    supportRequired: row.support_required,
    escalationRequired: Boolean(row.escalation_required),
    escalationLevel: row.escalation_level,
    evidenceReference: row.evidence_reference,
    actionStatus: row.action_status,
    status: row.status,
    createdBy: row.created_by,
    completedBy: row.completed_by,
    completedAt: row.completed_at,
    updatedAt: row.updated_at
  };
}

function inputParams(input) {
  return [
    input.category,
    input.description,
    input.severity,
    input.rootCause,
    input.consequenceForDelivery,
    input.proposedCorrectiveAction,
    input.responsiblePerson,
    input.targetDeadline || null,
    input.supportRequired,
    input.escalationRequired,
    input.escalationLevel,
    input.evidenceReference,
    input.actionStatus
  ];
}

async function assessmentForBottleneck(db, assessmentId) {
  const { rows } = await db.query(
    `SELECT a.*, ps.pe_name, ps.result_output
     FROM ps_assessments a
     JOIN products_services ps ON ps.id = a.product_service_id
     WHERE a.id = $1 AND a.sam1_cycle_id = $2`,
    [assessmentId, SAM1_CYCLE_ID]
  );
  if (!rows.length) {
    throw Object.assign(new Error('Bottlenecks can only be added to assessed Top 5 Products & Services.'), { status: 404 });
  }
  return rows[0];
}

export async function listAssessmentBottlenecks(assessmentId) {
  const { rows } = await pool.query(
    `SELECT b.*, ps.pe_name
     FROM bottlenecks b
     JOIN products_services ps ON ps.id = b.product_service_id
     WHERE b.assessment_id = $1 AND b.sam1_cycle_id = $2
     ORDER BY b.created_at DESC`,
    [assessmentId, SAM1_CYCLE_ID]
  );
  return rows.map(rowToBottleneck);
}

export async function createBottleneck(assessmentId, body, createdBy) {
  const input = normalizeBottleneckInput(body);
  validateBottleneckDraft(input);
  return withTransaction(async (db) => {
    const assessment = await assessmentForBottleneck(db, assessmentId);
    const { rows } = await db.query(
      `INSERT INTO bottlenecks (
        sam1_cycle_id, budget_centre_id, team_id, assessment_id, product_service_id, result_output,
        category, description, severity, root_cause, consequence_for_delivery,
        proposed_corrective_action, responsible_person, target_deadline, support_required,
        escalation_required, escalation_level, evidence_reference, action_status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
      RETURNING *`,
      [
        SAM1_CYCLE_ID,
        assessment.budget_centre_id,
        assessment.team_id,
        assessment.id,
        assessment.product_service_id,
        assessment.result_output,
        ...inputParams(input),
        createdBy
      ]
    );
    return rows[0];
  });
}

export async function updateBottleneck(bottleneckId, body) {
  const input = normalizeBottleneckInput(body);
  validateBottleneckDraft(input);
  const { rows } = await pool.query(
    `UPDATE bottlenecks
     SET category = $1,
         description = $2,
         severity = $3,
         root_cause = $4,
         consequence_for_delivery = $5,
         proposed_corrective_action = $6,
         responsible_person = $7,
         target_deadline = $8,
         support_required = $9,
         escalation_required = $10,
         escalation_level = $11,
         evidence_reference = $12,
         action_status = $13,
         status = 'draft',
         completed_by = NULL,
         completed_at = NULL,
         updated_at = now()
     WHERE id = $14
     RETURNING *`,
    [...inputParams(input), bottleneckId]
  );
  if (!rows.length) throw Object.assign(new Error('Bottleneck not found.'), { status: 404 });
  return rows[0];
}

export async function deleteBottleneck(bottleneckId) {
  const { rows } = await pool.query('DELETE FROM bottlenecks WHERE id = $1 RETURNING id', [bottleneckId]);
  if (!rows.length) throw Object.assign(new Error('Bottleneck not found.'), { status: 404 });
}

export async function completeBottleneck(bottleneckId, completedBy) {
  return withTransaction(async (db) => {
    const { rows } = await db.query('SELECT * FROM bottlenecks WHERE id = $1', [bottleneckId]);
    if (!rows.length) throw Object.assign(new Error('Bottleneck not found.'), { status: 404 });
    const input = normalizeBottleneckInput(rows[0]);
    validateBottleneckComplete(input);
    const completed = await db.query(
      `UPDATE bottlenecks
       SET status = 'complete',
           action_status = CASE WHEN escalation_required THEN 'Escalated' ELSE 'Proposed' END,
           completed_by = $1,
           completed_at = now(),
           updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [completedBy, bottleneckId]
    );
    return completed.rows[0];
  });
}

function heatmapFromRows(rows) {
  const categories = {};
  const severities = {};
  const teams = {};
  const outputs = {};
  const deliveryStatuses = {};
  let highCritical = 0;
  let escalations = 0;

  for (const row of rows) {
    categories[row.category] = (categories[row.category] ?? 0) + 1;
    severities[row.severity] = (severities[row.severity] ?? 0) + 1;
    teams[row.team_name] = (teams[row.team_name] ?? 0) + 1;
    outputs[row.result_output || 'Unspecified'] = (outputs[row.result_output || 'Unspecified'] ?? 0) + 1;
    deliveryStatuses[row.delivery_status || 'Not captured'] = (deliveryStatuses[row.delivery_status || 'Not captured'] ?? 0) + 1;
    if (['High', 'Critical'].includes(row.severity)) highCritical += 1;
    if (row.escalation_required) escalations += 1;
  }

  const mostFrequentCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None';
  const mostAffectedOutputs = Object.entries(outputs).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([output, count]) => ({ output, count }));
  return {
    count: rows.length,
    highCritical,
    escalations,
    categories,
    severities,
    teams,
    outputs,
    deliveryStatuses,
    mostFrequentCategory,
    mostAffectedOutputs
  };
}

async function bottleneckSummary(whereSql, params) {
  const { rows } = await pool.query(
    `SELECT b.*, ps.pe_name, t.name AS team_name, a.delivery_status, a.progress_percentage, a.output_risk_flag
     FROM bottlenecks b
     JOIN products_services ps ON ps.id = b.product_service_id
     JOIN teams t ON t.id = b.team_id
     JOIN ps_assessments a ON a.id = b.assessment_id
     WHERE ${whereSql} AND b.sam1_cycle_id = $${params.length + 1}
     ORDER BY b.updated_at DESC`,
    [...params, SAM1_CYCLE_ID]
  );
  const bottlenecks = rows.map(rowToBottleneck);
  return {
    heatmap: heatmapFromRows(rows),
    highCritical: bottlenecks.filter((item) => ['High', 'Critical'].includes(item.severity)),
    escalationCandidates: bottlenecks.filter((item) => item.escalationRequired || ['High', 'Critical'].includes(item.severity)),
    correctiveActions: bottlenecks.filter((item) => item.proposedCorrectiveAction),
    bottlenecks
  };
}

export async function teamBottleneckSummary(teamId) {
  const summary = await bottleneckSummary('b.team_id = $1', [teamId]);
  const { rows } = await pool.query(
    `SELECT
       a.id AS assessment_id,
       a.delivery_status,
       a.progress_percentage,
       a.output_risk_flag,
       s.rank,
       s.rationale,
       ps.pe_name,
       ps.result_output,
       COUNT(b.id)::int AS bottleneck_count,
       COUNT(CASE WHEN b.status = 'complete' THEN 1 END)::int AS complete_count
     FROM ps_assessments a
     JOIN team_ps_selections s ON s.id = a.selection_id
     JOIN products_services ps ON ps.id = a.product_service_id
     LEFT JOIN bottlenecks b ON b.assessment_id = a.id
     WHERE a.team_id = $1 AND a.sam1_cycle_id = $2
     GROUP BY a.id, s.rank, s.rationale, ps.pe_name, ps.result_output
     ORDER BY s.rank`,
    [teamId, SAM1_CYCLE_ID]
  );
  summary.assessedProducts = rows.map((row) => ({
    assessmentId: row.assessment_id,
    rank: row.rank,
    productServiceName: row.pe_name,
    resultOutput: row.result_output,
    rationale: row.rationale,
    deliveryStatus: row.delivery_status,
    progressPercentage: row.progress_percentage,
    outputRiskFlag: row.output_risk_flag,
    bottleneckCount: Number(row.bottleneck_count),
    bottleneckStatus: Number(row.bottleneck_count) === 0 ? 'None added' : Number(row.complete_count) === Number(row.bottleneck_count) ? 'Complete' : 'Draft',
    highestSeverity: 'None'
  }));
  for (const product of summary.assessedProducts) {
    const items = summary.bottlenecks.filter((item) => item.assessmentId === product.assessmentId);
    product.highestSeverity = highestSeverity(items);
    product.warnings = bottleneckWarnings({ assessment: product, bottlenecks: items });
  }
  return summary;
}

export async function budgetCentreBottleneckSummary(budgetCentreId) {
  return bottleneckSummary('b.budget_centre_id = $1', [budgetCentreId]);
}

export async function budgetCentreCorrectiveActions(budgetCentreId) {
  const summary = await budgetCentreBottleneckSummary(budgetCentreId);
  return summary.correctiveActions;
}
