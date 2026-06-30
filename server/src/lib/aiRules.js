export const aiServices = [
  'narrative_generation',
  'performance_analysis',
  'root_cause_suggestion',
  'decision_recommendation',
  'learning_synthesis',
  'executive_briefing',
  'regional_intelligence',
  'meeting_assistant',
  'question_answering'
];

export function labelDraft(content) {
  return `AI-generated draft\n\n${content}`;
}

export function estimateTokens(value) {
  return Math.ceil(JSON.stringify(value ?? '').length / 4);
}

export function requireCitations(citations) {
  if (!Array.isArray(citations) || citations.length === 0) {
    throw Object.assign(new Error('AI output must include evidence citations.'), { status: 500 });
  }
}

export function providerConfig() {
  return {
    activeProvider: process.env.AI_PROVIDER || 'mock',
    providers: ['mock', 'azure_openai', 'openai', 'local_future'],
    maxContextTokens: Number(process.env.AI_MAX_CONTEXT_TOKENS || 12000)
  };
}

export function enforceRoleScope(user, requestedScope = {}) {
  if (user?.role === 'admin') return requestedScope;
  return {
    ...requestedScope,
    centreCode: user?.centreCode ?? user?.centre_code ?? requestedScope.centreCode
  };
}
