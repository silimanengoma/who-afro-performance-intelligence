import { pool, withTransaction } from '../db.js';
import { SAM1_CYCLE_ID } from './selectionRules.js';
import {
  assessmentStatusLabel,
  assessmentWarnings,
  normalizeAssessmentInput,
  validateAssessmentComplete,
  validateAssessmentDraft
} from './assessmentRules.js';

function assessmentRow(row) {
  const assessment = {
    id: row.assessment_id ?? row.id ?? null,
    sam1CycleId: row.sam1_cycle_id ?? SAM1_CYCLE_ID,
    budgetCentreId: row.budget_centre_id,
    teamId: row.team_id,
    selectionId: row.selection_id,
    productServiceId: row.product_service_id,
    rank: row.rank,
    productServiceName: row.pe_name,
    resultOutput: row.result_output,
    selectionRationale: row.selection_rationale ?? row.rationale,
    deliveryStatus: row.delivery_status,
    progressPercentage: row.progress_percentage,
    plannedDeliverable: row.planned_deliverable,
    actualDeliverable: row.actual_deliverable,
    reportingPeriodComment: row.reporting_period_comment,
    evidenceSource: row.evidence_source,
    evidenceReference: row.evidence_reference,
    dataConfidence: row.data_confidence,
    dataQualityIssue: Boolean(row.data_quality_issue),
    dataQualityIssueDescription: row.data_quality_issue_description,
    contributionNarrative: row.contribution_narrative,
    contributionStrength: row.contribution_strength,
    contributionEvidence: row.contribution_evidence,
    outputRiskFlag: row.output_risk_flag,
    status: row.assessment_status ?? row.status ?? 'not_started',
    statusLabel: assessmentStatusLabel(row.assessment_status ?? row.status),
    completedBy: row.completed_by,
    completedAt: row.completed_at,
    updatedAt: row.updated_at
  };
  return {
    ...assessment,
    warnings: assessmentWarnings(assessment)
  };
}

function inputParams(input) {
  return [
    input.deliveryStatus,
    input.progressPercentage,
    input.plannedDeliverable,
    input.actualDeliverable,
    input.reportingPeriodComment,
    input.evidenceSource,
    input.evidenceReference,
    input.dataConfidence,
    input.dataQualityIssue,
    input.dataQualityIssueDescription,
    input.contributionNarrative,
    input.contributionStrength,
    input.contributionEvidence,
    input.outputRiskFlag
  ];
}

async function selectionForAssessment(db, selectionId) {
  const { rows } = await db.query(
    `SELECT s.*, ps.pe_name, ps.result_output
     FROM team_ps_selections s
     JOIN products_services ps ON ps.id = s.product_service_id
     WHERE s.id = $1 AND s.sam1_cycle_id = $2`,
    [selectionId, SAM1_CYCLE_ID]
  );
  if (!rows.length) {
    throw Object.assign(new Error('Only selected Top 5 Products & Services can be assessed.'), { status: 404 });
  }
  return rows[0];
}

async function hydratedAssessment(db, selectionId) {
  const { rows } = await db.query(
    `SELECT
       a.id AS assessment_id,
       a.sam1_cycle_id,
       s.budget_centre_id,
       s.team_id,
       s.id AS selection_id,
       s.product_service_id,
       s.rank,
       s.rationale AS selection_rationale,
       ps.pe_name,
       ps.result_output,
       a.delivery_status,
       a.progress_percentage,
       a.planned_deliverable,
       a.actual_deliverable,
       a.reporting_period_comment,
       a.evidence_source,
       a.evidence_reference,
       a.data_confidence,
       a.data_quality_issue,
       a.data_quality_issue_description,
       a.contribution_narrative,
       a.contribution_strength,
       a.contribution_evidence,
       a.output_risk_flag,
       COALESCE(a.status, 'not_started') AS assessment_status,
       a.completed_by,
       a.completed_at,
       a.updated_at
     FROM team_ps_selections s
     JOIN products_services ps ON ps.id = s.product_service_id
     LEFT JOIN ps_assessments a ON a.selection_id = s.id AND a.sam1_cycle_id = s.sam1_cycle_id
     WHERE s.id = $1 AND s.sam1_cycle_id = $2`,
    [selectionId, SAM1_CYCLE_ID]
  );
  return rows[0] ? assessmentRow(rows[0]) : null;
}

export async function listTeamAssessments(teamId) {
  const { rows } = await pool.query(
    `SELECT
       a.id AS assessment_id,
       s.sam1_cycle_id,
       s.budget_centre_id,
       s.team_id,
       s.id AS selection_id,
       s.product_service_id,
       s.rank,
       s.rationale AS selection_rationale,
       ps.pe_name,
       ps.result_output,
       a.delivery_status,
       a.progress_percentage,
       a.planned_deliverable,
       a.actual_deliverable,
       a.reporting_period_comment,
       a.evidence_source,
       a.evidence_reference,
       a.data_confidence,
       a.data_quality_issue,
       a.data_quality_issue_description,
       a.contribution_narrative,
       a.contribution_strength,
       a.contribution_evidence,
       a.output_risk_flag,
       COALESCE(a.status, 'not_started') AS assessment_status,
       a.completed_by,
       a.completed_at,
       a.updated_at
     FROM team_ps_selections s
     JOIN products_services ps ON ps.id = s.product_service_id
     LEFT JOIN ps_assessments a ON a.selection_id = s.id AND a.sam1_cycle_id = s.sam1_cycle_id
     WHERE s.team_id = $1 AND s.sam1_cycle_id = $2
     ORDER BY s.rank`,
    [teamId, SAM1_CYCLE_ID]
  );
  return rows.map(assessmentRow);
}

export async function getSelectionAssessment(selectionId) {
  return withTransaction(async (db) => {
    await selectionForAssessment(db, selectionId);
    return hydratedAssessment(db, selectionId);
  });
}

export async function saveSelectionAssessment(selectionId, body, userId) {
  const input = normalizeAssessmentInput(body);
  validateAssessmentDraft(input);
  return withTransaction(async (db) => {
    const selection = await selectionForAssessment(db, selectionId);
    const { rows } = await db.query(
      `INSERT INTO ps_assessments (
        sam1_cycle_id, budget_centre_id, team_id, selection_id, product_service_id,
        delivery_status, progress_percentage, planned_deliverable, actual_deliverable,
        reporting_period_comment, evidence_source, evidence_reference, data_confidence,
        data_quality_issue, data_quality_issue_description, contribution_narrative,
        contribution_strength, contribution_evidence, output_risk_flag, status
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'draft'
      )
      ON CONFLICT (sam1_cycle_id, selection_id) DO UPDATE SET
        delivery_status = EXCLUDED.delivery_status,
        progress_percentage = EXCLUDED.progress_percentage,
        planned_deliverable = EXCLUDED.planned_deliverable,
        actual_deliverable = EXCLUDED.actual_deliverable,
        reporting_period_comment = EXCLUDED.reporting_period_comment,
        evidence_source = EXCLUDED.evidence_source,
        evidence_reference = EXCLUDED.evidence_reference,
        data_confidence = EXCLUDED.data_confidence,
        data_quality_issue = EXCLUDED.data_quality_issue,
        data_quality_issue_description = EXCLUDED.data_quality_issue_description,
        contribution_narrative = EXCLUDED.contribution_narrative,
        contribution_strength = EXCLUDED.contribution_strength,
        contribution_evidence = EXCLUDED.contribution_evidence,
        output_risk_flag = EXCLUDED.output_risk_flag,
        status = 'draft',
        completed_by = NULL,
        completed_at = NULL,
        updated_at = now()
      RETURNING *`,
      [
        SAM1_CYCLE_ID,
        selection.budget_centre_id,
        selection.team_id,
        selection.id,
        selection.product_service_id,
        ...inputParams(input)
      ]
    );
    void userId;
    return rows[0];
  });
}

export async function updateAssessment(assessmentId, body) {
  const input = normalizeAssessmentInput(body);
  validateAssessmentDraft(input);
  const { rows } = await pool.query(
    `UPDATE ps_assessments
     SET delivery_status = $1,
         progress_percentage = $2,
         planned_deliverable = $3,
         actual_deliverable = $4,
         reporting_period_comment = $5,
         evidence_source = $6,
         evidence_reference = $7,
         data_confidence = $8,
         data_quality_issue = $9,
         data_quality_issue_description = $10,
         contribution_narrative = $11,
         contribution_strength = $12,
         contribution_evidence = $13,
         output_risk_flag = $14,
         status = 'draft',
         completed_by = NULL,
         completed_at = NULL,
         updated_at = now()
     WHERE id = $15
     RETURNING *`,
    [...inputParams(input), assessmentId]
  );
  if (!rows.length) throw Object.assign(new Error('Assessment not found.'), { status: 404 });
  return rows[0];
}

export async function completeAssessment(assessmentId, completedBy) {
  return withTransaction(async (db) => {
    const { rows } = await db.query(
      `SELECT a.*, ps.result_output
       FROM ps_assessments a
       JOIN products_services ps ON ps.id = a.product_service_id
       WHERE a.id = $1`,
      [assessmentId]
    );
    if (!rows.length) throw Object.assign(new Error('Assessment not found.'), { status: 404 });
    validateAssessmentComplete(rows[0], rows[0].result_output);
    const completed = await db.query(
      `UPDATE ps_assessments
       SET status = 'complete', completed_by = $1, completed_at = now(), updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [completedBy, assessmentId]
    );
    return completed.rows[0];
  });
}

export async function budgetCentreAssessmentStatus(budgetCentreId) {
  const { rows } = await pool.query(
    `WITH team_status AS (
       SELECT
         t.id,
         t.name,
         COUNT(DISTINCT s.id)::int AS selected_count,
         COUNT(DISTINCT CASE WHEN a.status = 'complete' THEN a.id END)::int AS completed_count,
         COUNT(DISTINCT CASE WHEN a.status = 'draft' THEN a.id END)::int AS draft_count,
         COUNT(DISTINCT CASE WHEN a.id IS NULL THEN s.id END)::int AS not_started_count,
         COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END)::int AS completed_selection_rows
       FROM teams t
       LEFT JOIN team_ps_selections s ON s.team_id = t.id AND s.sam1_cycle_id = $2
       LEFT JOIN ps_assessments a ON a.selection_id = s.id AND a.sam1_cycle_id = s.sam1_cycle_id
       WHERE t.budget_centre_id = $1
       GROUP BY t.id
     ),
     delivery_status AS (
       SELECT team_id, delivery_status, COUNT(*)::int AS count
       FROM ps_assessments
       WHERE sam1_cycle_id = $2 AND delivery_status IS NOT NULL
       GROUP BY team_id, delivery_status
     ),
     delivery_json AS (
       SELECT team_id, jsonb_object_agg(delivery_status, count) AS delivery_distribution
       FROM delivery_status
       GROUP BY team_id
     )
     SELECT team_status.*, delivery_json.delivery_distribution
     FROM team_status
     LEFT JOIN delivery_json ON delivery_json.team_id = team_status.id
     ORDER BY team_status.name`,
    [budgetCentreId, SAM1_CYCLE_ID]
  );

  return rows.map((row) => {
    const selected = Number(row.selected_count);
    const completed = Number(row.completed_count);
    const draft = Number(row.draft_count);
    const notStarted = Number(row.not_started_count);
    return {
      teamId: row.id,
      teamName: row.name,
      selectedCount: selected,
      selectionStatus: Number(row.completed_selection_rows) > 0 ? 'Completed' : selected > 0 ? 'In progress' : 'Not started',
      completedAssessments: completed,
      draftAssessments: draft,
      notStartedAssessments: notStarted,
      pendingAssessments: Math.max(selected - completed, 0),
      completionPercentage: selected ? Math.round((completed / selected) * 100) : 0,
      deliveryDistribution: row.delivery_distribution ?? {}
    };
  });
}

export function summarizeAssessments(assessments) {
  const total = assessments.length;
  const completed = assessments.filter((item) => item.status === 'complete').length;
  const drafts = assessments.filter((item) => item.status === 'draft').length;
  const notStarted = assessments.filter((item) => item.status === 'not_started').length;
  return {
    total,
    completed,
    drafts,
    notStarted,
    completionPercentage: total ? Math.round((completed / total) * 100) : 0
  };
}
