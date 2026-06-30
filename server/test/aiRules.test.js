import { describe, expect, it } from 'vitest';
import { aiServices, enforceRoleScope, estimateTokens, labelDraft, providerConfig, requireCitations } from '../src/lib/aiRules.js';

describe('ai rules', () => {
  it('lists the AI service layer', () => {
    expect(aiServices).toContain('question_answering');
    expect(aiServices).toContain('executive_briefing');
  });

  it('labels generated text as draft', () => {
    expect(labelDraft('Summary')).toMatch(/^AI-generated draft/);
  });

  it('requires citations', () => {
    expect(() => requireCitations([])).toThrow(/citations/);
    expect(() => requireCitations([{ entityType: 'assessment', entityId: '1' }])).not.toThrow();
  });

  it('estimates tokens and exposes provider config', () => {
    expect(estimateTokens({ a: 'abcd' })).toBeGreaterThan(0);
    expect(providerConfig().providers).toContain('openai');
  });

  it('scopes non-admin users to their centre', () => {
    expect(enforceRoleScope({ role: 'pmo', centreCode: 'ZMB' }, {}).centreCode).toBe('ZMB');
  });
});
