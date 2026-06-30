export function ratio(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

export function groupCount(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || 'Unspecified';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export function kpiMethodologies() {
  return {
    deliveryAccelerationIndex: 'Percentage of completed or on-track assessments out of all assessments.',
    countryRiskScore: 'Weighted score from at-risk/off-track outputs, high/critical bottlenecks, and escalations.',
    outputRiskIndex: 'Percentage of assessed outputs flagged at risk or off track.',
    regionalBottleneckIndex: 'High/Critical bottlenecks per assessed Product & Service.',
    financialConstraintIndex: 'Financial bottlenecks as a percentage of all bottlenecks.',
    hrConstraintIndex: 'Human Resources bottlenecks as a percentage of all bottlenecks.',
    procurementConstraintIndex: 'Procurement bottlenecks as a percentage of all bottlenecks.',
    escalationSeverityIndex: 'Escalation candidates weighted by High and Critical severity.',
    learningMaturityIndex: 'Validated learning themes per submitted country.',
    decisionResponsivenessScore: 'Completed decisions as a percentage of all decisions.',
    supportResponsivenessScore: 'Completed regional support actions as a percentage of support requests.'
  };
}

export function calculateRegionalKpis({ assessments = [], bottlenecks = [], decisions = [], learnings = [], submissions = [], supportActions = [] }) {
  const deliveryGood = assessments.filter((item) => ['Completed', 'On track'].includes(item.delivery_status)).length;
  const outputRisk = assessments.filter((item) => ['At risk', 'Off track'].includes(item.output_risk_flag)).length;
  const highCritical = bottlenecks.filter((item) => ['High', 'Critical'].includes(item.severity)).length;
  const escalations = bottlenecks.filter((item) => item.escalation_required || ['High', 'Critical'].includes(item.severity)).length;
  const completedDecisions = decisions.filter((item) => item.status === 'Completed' || item.status === 'Approved').length;
  const completedSupport = supportActions.filter((item) => item.status === 'Completed').length;
  return {
    deliveryAccelerationIndex: ratio(deliveryGood, assessments.length),
    countryRiskScore: outputRisk + highCritical * 2 + escalations,
    outputRiskIndex: ratio(outputRisk, assessments.length),
    regionalBottleneckIndex: assessments.length ? Number((highCritical / assessments.length).toFixed(2)) : 0,
    financialConstraintIndex: ratio(bottlenecks.filter((item) => item.category === 'Financial').length, bottlenecks.length),
    hrConstraintIndex: ratio(bottlenecks.filter((item) => item.category === 'Human Resources').length, bottlenecks.length),
    procurementConstraintIndex: ratio(bottlenecks.filter((item) => item.category === 'Procurement').length, bottlenecks.length),
    escalationSeverityIndex: highCritical + escalations,
    learningMaturityIndex: submissions.length ? Number((learnings.length / submissions.length).toFixed(2)) : 0,
    decisionResponsivenessScore: ratio(completedDecisions, decisions.length),
    supportResponsivenessScore: ratio(completedSupport, supportActions.length)
  };
}

export function executiveSignal(kpis) {
  if (kpis.countryRiskScore >= 10 || kpis.escalationSeverityIndex >= 8) return 'Executive attention required';
  if (kpis.deliveryAccelerationIndex >= 70) return 'Region broadly on track';
  if (kpis.deliveryAccelerationIndex === 0) return 'Insufficient evidence';
  return 'Mixed performance';
}
