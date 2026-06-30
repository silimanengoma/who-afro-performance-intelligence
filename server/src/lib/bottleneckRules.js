const categories = [
  'Financial',
  'Human Resources',
  'Procurement',
  'Contextual',
  'Partner / Government',
  'Data quality',
  'Operational planning',
  'Security',
  'Other'
];
const severities = ['Low', 'Medium', 'High', 'Critical'];
const supports = ['None', 'Country Office leadership', 'Cluster', 'Regional Office technical team', 'MSC', 'DPM', 'External partner'];
const escalationLevels = ['WR', 'Cluster Director', 'Regional Office', 'DPM', 'MEC'];
const actionStatuses = ['Draft', 'Proposed', 'Accepted', 'In progress', 'Completed', 'Escalated'];

function present(value) {
  return String(value ?? '').trim().length > 0;
}

function assertOneOf(value, allowed, field) {
  if (present(value) && !allowed.includes(value)) {
    throw Object.assign(new Error(`${field} must be one of: ${allowed.join(', ')}.`), { status: 400 });
  }
}

export function normalizeBottleneckInput(body = {}) {
  return {
    category: body.category ?? null,
    description: body.description ?? null,
    severity: body.severity ?? null,
    rootCause: body.rootCause ?? body.root_cause ?? null,
    consequenceForDelivery: body.consequenceForDelivery ?? body.consequence_for_delivery ?? null,
    proposedCorrectiveAction: body.proposedCorrectiveAction ?? body.proposed_corrective_action ?? null,
    responsiblePerson: body.responsiblePerson ?? body.responsible_person ?? null,
    targetDeadline: body.targetDeadline ?? body.target_deadline ?? null,
    supportRequired: body.supportRequired ?? body.support_required ?? 'None',
    escalationRequired: Boolean(body.escalationRequired ?? body.escalation_required),
    escalationLevel: body.escalationLevel ?? body.escalation_level ?? null,
    evidenceReference: body.evidenceReference ?? body.evidence_reference ?? null,
    actionStatus: body.actionStatus ?? body.action_status ?? 'Draft'
  };
}

export function validateBottleneckDraft(input) {
  assertOneOf(input.category, categories, 'Bottleneck category');
  assertOneOf(input.severity, severities, 'Severity');
  assertOneOf(input.supportRequired, supports, 'Support required');
  assertOneOf(input.escalationLevel, escalationLevels, 'Escalation level');
  assertOneOf(input.actionStatus, actionStatuses, 'Action status');
  const missing = [];
  if (!present(input.category)) missing.push('Category');
  if (!present(input.description)) missing.push('Description');
  if (!present(input.severity)) missing.push('Severity');
  if (missing.length) {
    throw Object.assign(new Error(`Complete these bottleneck fields before saving: ${missing.join(', ')}.`), { status: 400 });
  }
}

export function validateBottleneckComplete(input) {
  validateBottleneckDraft(input);
  const missing = [];
  if (!present(input.category)) missing.push('Category');
  if (!present(input.description)) missing.push('Description');
  if (!present(input.severity)) missing.push('Severity');
  if (['High', 'Critical'].includes(input.severity) && !present(input.rootCause)) missing.push('Root cause');
  if (['Medium', 'High', 'Critical'].includes(input.severity) && !present(input.proposedCorrectiveAction)) missing.push('Proposed corrective action');
  if (present(input.proposedCorrectiveAction) && !present(input.responsiblePerson)) missing.push('Responsible person');
  if (present(input.proposedCorrectiveAction) && !present(input.targetDeadline)) missing.push('Target deadline');
  if (input.escalationRequired && !present(input.escalationLevel)) missing.push('Escalation level');
  if (missing.length) {
    throw Object.assign(new Error(`Complete these bottleneck fields before submission: ${missing.join(', ')}.`), { status: 400 });
  }
}

export function bottleneckWarnings({ assessment, bottlenecks }) {
  const deliveryStatus = assessment?.deliveryStatus ?? assessment?.delivery_status;
  if (['Delayed', 'At risk', 'Not started'].includes(deliveryStatus) && bottlenecks.length === 0) {
    return ['This Product & Service is delayed, at risk, or not started. Add a bottleneck diagnosis to explain what is blocking delivery.'];
  }
  return [];
}

export function severityWeight(severity) {
  return { Low: 1, Medium: 2, High: 3, Critical: 4 }[severity] ?? 0;
}

export function highestSeverity(items) {
  return items.reduce((highest, item) => (severityWeight(item.severity) > severityWeight(highest) ? item.severity : highest), 'None');
}
