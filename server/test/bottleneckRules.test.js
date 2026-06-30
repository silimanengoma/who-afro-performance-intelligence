import { describe, expect, it } from 'vitest';
import {
  bottleneckWarnings,
  highestSeverity,
  normalizeBottleneckInput,
  validateBottleneckComplete,
  validateBottleneckDraft
} from '../src/lib/bottleneckRules.js';

const completeBottleneck = {
  category: 'Procurement',
  description: 'Procurement process is taking longer than planned.',
  severity: 'High',
  rootCause: 'Late specifications and limited supplier availability.',
  proposedCorrectiveAction: 'Escalate specifications review and confirm supplier shortlist.',
  responsiblePerson: 'Operations officer',
  targetDeadline: '2026-07-15',
  supportRequired: 'MSC',
  escalationRequired: true,
  escalationLevel: 'Regional Office'
};

describe('bottleneck rules', () => {
  it('allows a bottleneck to be saved as draft for an assessed Product & Service', () => {
    expect(() => validateBottleneckDraft({ category: 'Financial', description: 'Budget release is pending.', severity: 'Low' })).not.toThrow();
  });

  it('allows multiple bottleneck records to be ranked for severity summaries', () => {
    expect(highestSeverity([{ severity: 'Low' }, { severity: 'Critical' }, { severity: 'Medium' }])).toBe('Critical');
  });

  it('requires root cause and corrective action for High/Critical bottlenecks', () => {
    expect(() => validateBottleneckComplete({ ...completeBottleneck, rootCause: '', proposedCorrectiveAction: '' })).toThrow(/Root cause.*Proposed corrective action/i);
  });

  it('requires escalation level when escalation is marked yes', () => {
    expect(() => validateBottleneckComplete({ ...completeBottleneck, escalationLevel: '' })).toThrow(/Escalation level/i);
  });

  it('requires responsible person and deadline when corrective action is entered', () => {
    expect(() => validateBottleneckComplete({ ...completeBottleneck, responsiblePerson: '', targetDeadline: '' })).toThrow(/Responsible person.*Target deadline/i);
  });

  it('normalizes snake_case payloads from database rows', () => {
    expect(normalizeBottleneckInput({ root_cause: 'Root', escalation_required: true }).rootCause).toBe('Root');
  });

  it('warns when delayed work has no bottleneck', () => {
    expect(bottleneckWarnings({ assessment: { deliveryStatus: 'Delayed' }, bottlenecks: [] })).toHaveLength(1);
  });
});
