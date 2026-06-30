import { pool, withTransaction } from '../db.js';
import { countryIntelligence, countryReviewPack, getExecutiveSummary } from './countryRepository.js';
import { SAM1_CYCLE_ID } from './selectionRules.js';
import {
  assertCanSignOff,
  performanceSignal,
  signoffChecklist,
  validateDecisionLogFinal,
  validateWrAssessment
} from './wrReviewRules.js';

function meetingRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    sam1CycleId: row.sam1_cycle_id,
    budgetCentreId: row.budget_centre_id,
    reviewDate: row.review_date,
    chairUserId: row.chair_user_id,
    facilitatorUserId: row.facilitator_user_id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    lockedAt: row.locked_at,
    signedOffBy: row.signed_off_by,
    signedOffAt: row.signed_off_at
  };
}

function decisionRow(row) {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    issue: row.issue,
    productServiceId: row.product_service_id,
    resultOutput: row.result_output,
    decision: row.decision,
    responsiblePerson: row.responsible_person,
    deadline: row.deadline,
    escalationRequired: Boolean(row.escalation_required),
    escalationLevel: row.escalation_level,
    status: row.status,
    source: row.source,
    sourceEntityType: row.source_entity_type,
    sourceEntityId: row.source_entity_id,
    finalized: Boolean(row.finalized)
  };
}

function wrAssessmentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    meetingId: row.meeting_id,
    performanceSignal: row.performance_signal,
    overallAssessment: row.overall_assessment,
    mainDeliveryConcern: row.main_delivery_concern,
    mainCorrectiveDecision: row.main_corrective_decision,
    regionalSupportRequired: row.regional_support_required,
    wrChairConfirmation: Boolean(row.wr_chair_confirmation)
  };
}

async function audit(db, userId, action, entityType, entityId, metadata = {}) {
  await db.query(
    'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)',
    [userId, action, entityType, entityId, metadata]
  );
}

async function assertUnlocked(db, meetingId) {
  const { rowCount } = await db.query('SELECT 1 FROM submission_locks WHERE meeting_id = $1', [meetingId]);
  if (rowCount) throw Object.assign(new Error('Country submission is locked. Reopening requires Admin / MSC action.'), { status: 423 });
}

export async function getOrCreateMeeting(budgetCentreId) {
  const { rows } = await pool.query(
    `SELECT * FROM country_review_meetings
     WHERE sam1_cycle_id = $1 AND ($2::uuid IS NULL OR budget_centre_id = $2)
     ORDER BY created_at DESC LIMIT 1`,
    [SAM1_CYCLE_ID, budgetCentreId || null]
  );
  return meetingRow(rows[0]);
}

export async function startMeeting(budgetCentreId, userId) {
  const intelligence = await countryIntelligence();
  if (intelligence.readiness.readinessIndicator !== 'Ready for WR Review') {
    throw Object.assign(new Error('WR Review cannot start until Country Intelligence is Ready for WR Review.'), { status: 400 });
  }
  const { rows } = await pool.query(
    `INSERT INTO country_review_meetings (
      sam1_cycle_id, budget_centre_id, facilitator_user_id, status, started_at
    ) VALUES ($1, $2, $3, 'In session', now())
    RETURNING *`,
    [SAM1_CYCLE_ID, budgetCentreId || null, userId]
  );
  return meetingRow(rows[0]);
}

export async function updateMeetingStatus(meetingId, status) {
  const { rows } = await pool.query(
    'UPDATE country_review_meetings SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
    [status, meetingId]
  );
  if (!rows.length) throw Object.assign(new Error('WR Review meeting not found.'), { status: 404 });
  return meetingRow(rows[0]);
}

export async function meetingIntelligence(_meetingId) {
  return countryIntelligence();
}

export async function deliveryReview(meetingId) {
  const intelligence = await meetingIntelligence(meetingId);
  return {
    performanceSignal: performanceSignal(intelligence.delivery.distribution),
    distribution: intelligence.delivery.distribution,
    issues: intelligence.escalationCandidates.map((item) => ({
      ...item,
      decisionNeeded: true,
      reviewAction: 'Requires discussion'
    }))
  };
}

export async function outputReview(meetingId) {
  return { outputs: (await meetingIntelligence(meetingId)).outputIntelligence };
}

export async function bottleneckReview(meetingId) {
  return (await meetingIntelligence(meetingId)).bottleneckIntelligence;
}

export async function escalationReview(meetingId) {
  return { escalationCandidates: (await meetingIntelligence(meetingId)).escalationCandidates };
}

export async function learningReview(meetingId) {
  const intelligence = await meetingIntelligence(meetingId);
  const { rows } = await pool.query('SELECT * FROM validated_learning_themes WHERE meeting_id = $1 ORDER BY created_at', [meetingId]);
  return {
    learningThemes: rows.length ? rows.map((row) => ({
      id: row.id,
      category: row.category,
      theme: row.theme,
      description: row.description,
      regionalSharing: row.regional_sharing,
      accepted: row.accepted
    })) : intelligence.learnings.map((item) => ({
      category: item.category,
      theme: item.theme,
      description: item.theme,
      regionalSharing: false,
      accepted: false
    }))
  };
}

export async function saveWrAssessment(meetingId, body) {
  const { rows } = await pool.query(
    `INSERT INTO wr_assessments (
      meeting_id, performance_signal, overall_assessment, main_delivery_concern,
      main_corrective_decision, regional_support_required, wr_chair_confirmation
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (meeting_id) DO UPDATE SET
      performance_signal = EXCLUDED.performance_signal,
      overall_assessment = EXCLUDED.overall_assessment,
      main_delivery_concern = EXCLUDED.main_delivery_concern,
      main_corrective_decision = EXCLUDED.main_corrective_decision,
      regional_support_required = EXCLUDED.regional_support_required,
      wr_chair_confirmation = EXCLUDED.wr_chair_confirmation,
      updated_at = now()
    RETURNING *`,
    [
      meetingId,
      body.performanceSignal,
      body.overallAssessment,
      body.mainDeliveryConcern,
      body.mainCorrectiveDecision,
      body.regionalSupportRequired,
      Boolean(body.wrChairConfirmation)
    ]
  );
  return wrAssessmentRow(rows[0]);
}

export async function listDecisions(meetingId) {
  const { rows } = await pool.query('SELECT * FROM final_decision_logs WHERE meeting_id = $1 ORDER BY created_at', [meetingId]);
  return rows.map(decisionRow);
}

export async function createDecision(meetingId, body) {
  const { rows } = await pool.query(
    `INSERT INTO final_decision_logs (
      meeting_id, issue, product_service_id, result_output, decision, responsible_person,
      deadline, escalation_required, escalation_level, status, source, source_entity_type, source_entity_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *`,
    [
      meetingId,
      body.issue ?? '',
      body.productServiceId || null,
      body.resultOutput ?? null,
      body.decision ?? '',
      body.responsiblePerson ?? '',
      body.deadline || null,
      Boolean(body.escalationRequired),
      body.escalationLevel || null,
      body.status ?? 'In progress',
      body.source ?? 'Manual entry',
      body.sourceEntityType ?? null,
      body.sourceEntityId || null
    ]
  );
  return decisionRow(rows[0]);
}

export async function updateDecision(meetingId, decisionId, body) {
  const { rows } = await pool.query(
    `UPDATE final_decision_logs
     SET issue = $1, product_service_id = $2, result_output = $3, decision = $4,
         responsible_person = $5, deadline = $6, escalation_required = $7,
         escalation_level = $8, status = $9, source = $10, updated_at = now()
     WHERE id = $11 AND meeting_id = $12
     RETURNING *`,
    [
      body.issue ?? '',
      body.productServiceId || null,
      body.resultOutput ?? null,
      body.decision ?? '',
      body.responsiblePerson ?? '',
      body.deadline || null,
      Boolean(body.escalationRequired),
      body.escalationLevel || null,
      body.status ?? 'In progress',
      body.source ?? 'Manual entry',
      decisionId,
      meetingId
    ]
  );
  if (!rows.length) throw Object.assign(new Error('Decision not found.'), { status: 404 });
  return decisionRow(rows[0]);
}

export async function deleteDecision(meetingId, decisionId) {
  const { rowCount } = await pool.query('DELETE FROM final_decision_logs WHERE id = $1 AND meeting_id = $2 AND finalized = false', [decisionId, meetingId]);
  if (!rowCount) throw Object.assign(new Error('Decision not found or already finalized.'), { status: 404 });
}

export async function finalizeDecisionLog(meetingId) {
  const decisions = await listDecisions(meetingId);
  validateDecisionLogFinal(decisions);
  await pool.query("UPDATE final_decision_logs SET finalized = true, status = CASE WHEN escalation_required THEN 'Escalated' ELSE 'Approved' END, updated_at = now() WHERE meeting_id = $1", [meetingId]);
  await pool.query("UPDATE country_review_meetings SET status = 'Ready for sign-off', updated_at = now() WHERE id = $1", [meetingId]);
  return listDecisions(meetingId);
}

export async function validateLearningThemes(meetingId, themes) {
  await pool.query('DELETE FROM validated_learning_themes WHERE meeting_id = $1', [meetingId]);
  for (const theme of themes) {
    await pool.query(
      `INSERT INTO validated_learning_themes (meeting_id, category, theme, description, regional_sharing, accepted)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [meetingId, theme.category, theme.theme, theme.description ?? '', Boolean(theme.regionalSharing), theme.accepted !== false]
    );
  }
  return learningReview(meetingId);
}

async function signoffState(meetingId) {
  const wrRows = await pool.query('SELECT * FROM wr_assessments WHERE meeting_id = $1', [meetingId]);
  const wrAssessment = wrAssessmentRow(wrRows.rows[0]);
  if (wrAssessment) validateWrAssessment(wrAssessment);
  const decisions = await listDecisions(meetingId);
  const learningRows = await pool.query('SELECT COUNT(*)::int AS count FROM validated_learning_themes WHERE meeting_id = $1 AND accepted = true', [meetingId]);
  const reviewRows = await pool.query('SELECT COUNT(*)::int AS count FROM country_reviews WHERE sam1_cycle_id = $1', [SAM1_CYCLE_ID]);
  const escalations = (await escalationReview(meetingId)).escalationCandidates;
  return {
    wrAssessment,
    decisions,
    checklist: signoffChecklist({
      wrAssessment,
      decisionFinalized: decisions.length > 0 && decisions.every((decision) => decision.finalized),
      learningValidated: learningRows.rows[0].count > 0,
      reviewPackGenerated: reviewRows.rows[0].count > 0,
      escalationsReviewed: escalations.length === 0 || decisions.some((decision) => decision.source === 'Escalation review' || decision.escalationRequired)
    })
  };
}

export async function signOff(meetingId, userId) {
  return withTransaction(async (db) => {
    await assertUnlocked(db, meetingId);
    const state = await signoffState(meetingId);
    assertCanSignOff(state.checklist);
    const { rows } = await db.query(
      "UPDATE country_review_meetings SET status = 'Signed and locked', signed_off_by = $1, signed_off_at = now(), completed_at = now(), updated_at = now() WHERE id = $2 RETURNING *",
      [userId, meetingId]
    );
    await audit(db, userId, 'signoff', 'country_review_meeting', meetingId, state.checklist);
    return meetingRow(rows[0]);
  });
}

export async function lockSubmission(meetingId, userId, reason = 'WR signed off Country SAM 1 submission') {
  return withTransaction(async (db) => {
    const versionRows = await db.query('SELECT COALESCE(MAX(version), 0) + 1 AS version FROM submission_locks');
    const { rows } = await db.query(
      `INSERT INTO submission_locks (meeting_id, locked_by, lock_reason, version)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (meeting_id) DO UPDATE SET locked_by = EXCLUDED.locked_by, locked_at = now(), lock_reason = EXCLUDED.lock_reason
       RETURNING *`,
      [meetingId, userId, reason, versionRows.rows[0].version]
    );
    await db.query("UPDATE country_review_meetings SET status = 'Signed and locked', locked_at = now(), updated_at = now() WHERE id = $1", [meetingId]);
    await audit(db, userId, 'lock', 'submission_lock', rows[0].id, { meetingId, reason });
    return rows[0];
  });
}

export async function submissionPackage(meetingId, userId) {
  const intelligence = await countryIntelligence();
  const summary = await getExecutiveSummary();
  const wrRows = await pool.query('SELECT * FROM wr_assessments WHERE meeting_id = $1', [meetingId]);
  const decisions = await listDecisions(meetingId);
  const learnings = await learningReview(meetingId);
  const pack = await countryReviewPack(userId);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Official Country SAM 1 Submission</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#17211d}section{border-top:1px solid #d7ded6;margin-top:18px;padding-top:18px}pre{white-space:pre-wrap}table{border-collapse:collapse;width:100%}td,th{border:1px solid #dce3da;padding:8px}</style></head><body><h1>Official Country SAM 1 Submission</h1><section><h2>1 Cover page</h2><p>SAM 1 Cycle: ${SAM1_CYCLE_ID}</p></section><section><h2>2 Country executive summary</h2><pre>${summary}</pre></section><section><h2>3 WR Assessment</h2><pre>${JSON.stringify(wrAssessmentRow(wrRows.rows[0]), null, 2)}</pre></section><section><h2>4 Delivery performance summary</h2><pre>${JSON.stringify(intelligence.delivery, null, 2)}</pre></section><section><h2>5 GPW14 Output contribution summary</h2><pre>${JSON.stringify(intelligence.outputIntelligence, null, 2)}</pre></section><section><h2>6 Bottleneck summary</h2><pre>${JSON.stringify(intelligence.bottleneckIntelligence, null, 2)}</pre></section><section><h2>7 Confirmed escalations</h2><pre>${JSON.stringify(intelligence.escalationCandidates, null, 2)}</pre></section><section><h2>8 Learning summary</h2><pre>${JSON.stringify(learnings.learningThemes, null, 2)}</pre></section><section><h2>9 Final Decision Log</h2><pre>${JSON.stringify(decisions, null, 2)}</pre></section><section><h2>10 Annex: Team P/S assessment details</h2><pre>${JSON.stringify(pack, null, 2)}</pre></section></body></html>`;
  return { html, pdf: html, docx: html };
}

export async function decisionCsv(meetingId) {
  const decisions = await listDecisions(meetingId);
  const header = ['Issue', 'Related Output', 'Decision', 'Responsible person', 'Deadline', 'Escalation required', 'Escalation level', 'Status', 'Source'];
  const rows = decisions.map((decision) => [
    decision.issue,
    decision.resultOutput,
    decision.decision,
    decision.responsiblePerson,
    decision.deadline,
    decision.escalationRequired ? 'Yes' : 'No',
    decision.escalationLevel,
    decision.status,
    decision.source
  ]);
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
}
