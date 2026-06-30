const signals = ['Improving', 'Stable', 'Declining', 'Insufficient evidence'];

function present(value) {
  return String(value ?? '').trim().length > 0;
}

export function validateWrAssessment(input = {}) {
  const missing = [];
  if (!present(input.overallAssessment ?? input.overall_assessment)) missing.push('Overall assessment');
  if (!present(input.performanceSignal ?? input.performance_signal)) missing.push('Country performance signal');
  if (!signals.includes(input.performanceSignal ?? input.performance_signal)) missing.push('Valid country performance signal');
  if (!(input.wrChairConfirmation ?? input.wr_chair_confirmation)) missing.push('WR chair confirmation');
  if (missing.length) {
    throw Object.assign(new Error(`Complete WR Assessment before sign-off: ${missing.join(', ')}.`), { status: 400 });
  }
}

export function validateDecision(input = {}) {
  const missing = [];
  if (!present(input.decision)) missing.push('Decision');
  if (!present(input.responsiblePerson ?? input.responsible_person)) missing.push('Responsible person');
  if (!present(input.deadline)) missing.push('Deadline');
  if (Boolean(input.escalationRequired ?? input.escalation_required) && !present(input.escalationLevel ?? input.escalation_level)) {
    missing.push('Escalation level');
  }
  if (missing.length) {
    throw Object.assign(new Error(`Decision Log entry is missing: ${missing.join(', ')}.`), { status: 400 });
  }
}

export function validateDecisionLogFinal(decisions) {
  if (!decisions.length) {
    throw Object.assign(new Error('Add at least one Decision Log entry before finalization.'), { status: 400 });
  }
  decisions.forEach(validateDecision);
}

export function signoffChecklist({ wrAssessment, decisionFinalized, learningValidated, reviewPackGenerated, escalationsReviewed }) {
  return {
    wrAssessmentCompleted: Boolean(wrAssessment),
    decisionLogFinalized: Boolean(decisionFinalized),
    learningThemesValidated: Boolean(learningValidated),
    escalationsReviewed: Boolean(escalationsReviewed),
    countryReviewPackGenerated: Boolean(reviewPackGenerated)
  };
}

export function assertCanSignOff(checklist) {
  const missing = Object.entries(checklist).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) {
    throw Object.assign(new Error(`Cannot sign off until these are complete: ${missing.join(', ')}.`), { status: 400 });
  }
}

export function performanceSignal(deliveryDistribution = {}) {
  const completed = deliveryDistribution.Completed ?? 0;
  const onTrack = deliveryDistribution['On track'] ?? 0;
  const delayed = deliveryDistribution.Delayed ?? 0;
  const atRisk = deliveryDistribution['At risk'] ?? 0;
  const notStarted = deliveryDistribution['Not started'] ?? 0;
  if (completed + onTrack + delayed + atRisk + notStarted === 0) return 'Insufficient evidence';
  if (completed + onTrack >= delayed + atRisk + notStarted) return 'Stable';
  return 'Declining';
}
