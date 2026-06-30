import { describe, expect, it } from 'vitest';
import {
  assertCanSignOff,
  performanceSignal,
  signoffChecklist,
  validateDecision,
  validateDecisionLogFinal,
  validateWrAssessment
} from '../src/lib/wrReviewRules.js';

describe('WR review rules', () => {
  it('requires WR assessment before sign-off', () => {
    expect(() => validateWrAssessment({ performanceSignal: 'Stable' })).toThrow(/Overall assessment/);
  });

  it('requires owner and deadline for decisions', () => {
    expect(() => validateDecision({ decision: 'Approve action' })).toThrow(/Responsible person.*Deadline/);
  });

  it('requires escalation level for escalated decisions', () => {
    expect(() => validateDecision({ decision: 'Escalate', responsiblePerson: 'PMO', deadline: '2026-07-20', escalationRequired: true })).toThrow(/Escalation level/);
  });

  it('finalizes only valid decision logs', () => {
    expect(() => validateDecisionLogFinal([{ decision: 'Approve', responsiblePerson: 'WR', deadline: '2026-07-20' }])).not.toThrow();
  });

  it('blocks sign-off when checklist is incomplete', () => {
    const checklist = signoffChecklist({ wrAssessment: true, decisionFinalized: false, learningValidated: true, reviewPackGenerated: true, escalationsReviewed: true });
    expect(() => assertCanSignOff(checklist)).toThrow(/decisionLogFinalized/);
  });

  it('derives performance signal from delivery mix', () => {
    expect(performanceSignal({ Completed: 2, 'On track': 1, Delayed: 4 })).toBe('Declining');
    expect(performanceSignal({ Completed: 4, Delayed: 1 })).toBe('Stable');
  });
});
