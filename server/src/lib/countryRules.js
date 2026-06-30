export function readinessIndicator({ teamsParticipating, teamsCompleted }) {
  if (!teamsParticipating) return 'Not Started';
  if (teamsCompleted >= teamsParticipating) return 'Ready for WR Review';
  return 'In Progress';
}

export function percentage(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

export function groupCount(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || 'Unspecified';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export function detectEscalationReason(item) {
  if (item.escalationRequired) return 'Escalation was explicitly requested by the team.';
  if (item.severity === 'Critical') return 'Critical severity requires senior management attention.';
  if (item.severity === 'High') return 'High severity may block delivery without management action.';
  return 'Pattern detected across team submissions.';
}

export function suggestedEscalationDestination(item) {
  if (item.escalationLevel) return item.escalationLevel;
  if (item.supportRequired === 'MSC') return 'MSC';
  if (item.supportRequired === 'DPM') return 'DPM';
  if (item.supportRequired?.includes('Regional')) return 'Regional Office';
  if (item.supportRequired === 'Cluster') return 'Cluster';
  return 'WR';
}

export function learningCategory(item) {
  const text = `${item.category} ${item.description} ${item.rootCause} ${item.consequenceForDelivery}`.toLowerCase();
  if (text.includes('innovation') || text.includes('new approach')) return 'Innovations';
  if (text.includes('adapt') || text.includes('pivot')) return 'Adaptive management';
  if (text.includes('capacity') || text.includes('staff') || text.includes('human')) return 'Capacity gaps';
  if (text.includes('system') || text.includes('process') || text.includes('procurement')) return 'System weaknesses';
  if (['High', 'Critical'].includes(item.severity)) return 'Management lessons';
  return item.deliveryStatus === 'Completed' || item.contributionStrength === 'Strong' ? 'Good practices' : 'Recurring failures';
}
