export const initialPilotCountries = ['Zambia', 'Sierra Leone', 'Chad'];

export function readinessScore(items) {
  return items.length ? Math.round((items.filter((item) => item.completed).length / items.length) * 100) : 0;
}

export function trafficLight({ completion = 0, openIssues = 0, criticalDefects = 0 }) {
  if (criticalDefects > 0 || openIssues > 10 || completion < 50) return 'Red';
  if (openIssues > 3 || completion < 80) return 'Amber';
  return 'Green';
}

export function onboardingSteps(role) {
  const steps = {
    team_lead: ['Upload not required', 'Select Top 5 P/S', 'Complete assessments', 'Add bottlenecks'],
    pmo: ['Monitor completion', 'Generate Country Review Pack', 'Prepare WR Review'],
    wr: ['Executive Dashboard', 'Review meeting mode', 'Decision Log', 'Sign-off'],
    admin: ['Regional Intelligence', 'Submission monitoring', 'Country comparison', 'Administration Console']
  };
  return steps[role] ?? ['Open dashboard', 'Review assigned actions', 'Use Help Centre'];
}

export function pilotKpis({ analytics = [], feedback = [], checklist = [] }) {
  return {
    userAdoption: new Set(analytics.map((item) => item.user_id).filter(Boolean)).size,
    supportTickets: feedback.length,
    criticalDefects: feedback.filter((item) => item.priority === 'Critical').length,
    readinessScore: readinessScore(checklist),
    aiUsefulness: analytics.filter((item) => item.event_name?.startsWith('ai.')).length,
    systemReliability: feedback.filter((item) => item.feedback_type === 'Bug').length === 0 ? 'High' : 'Watch'
  };
}
