const deliveryStatuses = ['Completed', 'On track', 'Delayed', 'Not started', 'At risk'];
const dataConfidences = ['Confirmed', 'Estimated', 'Unavailable'];
const contributionStrengths = ['Strong', 'Moderate', 'Weak', 'Unclear'];
const outputRiskFlags = ['On track', 'At risk', 'Off track', 'Unknown'];

function present(value) {
  return String(value ?? '').trim().length > 0;
}

function assertOneOf(value, allowed, field) {
  if (present(value) && !allowed.includes(value)) {
    throw Object.assign(new Error(`${field} must be one of: ${allowed.join(', ')}.`), { status: 400 });
  }
}

export function normalizeAssessmentInput(body = {}) {
  return {
    deliveryStatus: body.deliveryStatus ?? body.delivery_status ?? null,
    progressPercentage: body.progressPercentage === '' || body.progress_percentage === '' || (body.progressPercentage === undefined && body.progress_percentage === undefined)
      ? null
      : Number(body.progressPercentage ?? body.progress_percentage),
    plannedDeliverable: body.plannedDeliverable ?? body.planned_deliverable ?? null,
    actualDeliverable: body.actualDeliverable ?? body.actual_deliverable ?? null,
    reportingPeriodComment: body.reportingPeriodComment ?? body.reporting_period_comment ?? null,
    evidenceSource: body.evidenceSource ?? body.evidence_source ?? null,
    evidenceReference: body.evidenceReference ?? body.evidence_reference ?? null,
    dataConfidence: body.dataConfidence ?? body.data_confidence ?? null,
    dataQualityIssue: Boolean(body.dataQualityIssue ?? body.data_quality_issue),
    dataQualityIssueDescription: body.dataQualityIssueDescription ?? body.data_quality_issue_description ?? null,
    contributionNarrative: body.contributionNarrative ?? body.contribution_narrative ?? null,
    contributionStrength: body.contributionStrength ?? body.contribution_strength ?? null,
    contributionEvidence: body.contributionEvidence ?? body.contribution_evidence ?? null,
    outputRiskFlag: body.outputRiskFlag ?? body.output_risk_flag ?? null
  };
}

export function validateAssessmentDraft(input) {
  if (input.progressPercentage !== null && (!Number.isFinite(input.progressPercentage) || input.progressPercentage < 0 || input.progressPercentage > 100)) {
    throw Object.assign(new Error('Progress percentage must be between 0 and 100.'), { status: 400 });
  }
  assertOneOf(input.deliveryStatus, deliveryStatuses, 'Delivery status');
  assertOneOf(input.dataConfidence, dataConfidences, 'Data confidence');
  assertOneOf(input.contributionStrength, contributionStrengths, 'Contribution strength');
  assertOneOf(input.outputRiskFlag, outputRiskFlags, 'Output risk flag');
}

export function validateAssessmentComplete(assessment, resultOutput) {
  const input = normalizeAssessmentInput(assessment);
  validateAssessmentDraft(input);
  const missing = [];

  if (!present(input.deliveryStatus)) missing.push('Delivery status');
  if (input.progressPercentage === null) missing.push('Progress percentage');
  if (!present(input.plannedDeliverable)) missing.push('Planned deliverable');
  if (input.deliveryStatus !== 'Not started' && !present(input.actualDeliverable)) missing.push('Actual deliverable');
  if (!present(input.dataConfidence)) missing.push('Data confidence');
  if (input.dataConfidence !== 'Unavailable' && !present(input.evidenceSource)) missing.push('Evidence/source');
  if (input.dataQualityIssue && !present(input.dataQualityIssueDescription)) missing.push('Data quality issue description');
  if (!present(input.contributionNarrative)) missing.push('Contribution narrative');
  if (!present(resultOutput)) missing.push('Related GPW14 Output');
  if (!present(input.contributionStrength)) missing.push('Contribution strength');
  if (!present(input.outputRiskFlag)) missing.push('Output risk flag');

  if (missing.length) {
    throw Object.assign(new Error(`Complete these required fields before submission: ${missing.join(', ')}.`), { status: 400 });
  }
}

export function assessmentWarnings(assessment) {
  const warnings = [];
  if (assessment.deliveryStatus === 'Completed' && assessment.progressPercentage !== null && Number(assessment.progressPercentage) !== 100) {
    warnings.push('Delivery status is Completed, but progress is not 100%.');
  }
  if (assessment.deliveryStatus === 'Not started' && assessment.progressPercentage !== null && Number(assessment.progressPercentage) !== 0) {
    warnings.push('Delivery status is Not started, but progress is not 0%.');
  }
  if (assessment.dataConfidence === 'Unavailable') {
    warnings.push('Data confidence is Unavailable; this may affect submission quality.');
  }
  return warnings;
}

export function assessmentStatusLabel(status) {
  if (status === 'complete') return 'Complete';
  if (status === 'draft') return 'Draft';
  return 'Not started';
}
