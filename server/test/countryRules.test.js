import { describe, expect, it } from 'vitest';
import {
  detectEscalationReason,
  groupCount,
  learningCategory,
  percentage,
  readinessIndicator,
  suggestedEscalationDestination
} from '../src/lib/countryRules.js';

describe('country intelligence rules', () => {
  it('calculates readiness labels', () => {
    expect(readinessIndicator({ teamsParticipating: 0, teamsCompleted: 0 })).toBe('Not Started');
    expect(readinessIndicator({ teamsParticipating: 4, teamsCompleted: 2 })).toBe('In Progress');
    expect(readinessIndicator({ teamsParticipating: 4, teamsCompleted: 4 })).toBe('Ready for WR Review');
  });

  it('calculates completion percentages', () => {
    expect(percentage(3, 5)).toBe(60);
    expect(percentage(0, 0)).toBe(0);
  });

  it('groups counts for dashboard charts', () => {
    expect(groupCount([{ status: 'Delayed' }, { status: 'Delayed' }, { status: 'Completed' }], (item) => item.status)).toEqual({
      Delayed: 2,
      Completed: 1
    });
  });

  it('detects escalation reasons and destination', () => {
    const item = { severity: 'Critical', supportRequired: 'MSC' };
    expect(detectEscalationReason(item)).toMatch(/Critical/);
    expect(suggestedEscalationDestination(item)).toBe('MSC');
  });

  it('clusters learning themes', () => {
    expect(learningCategory({ category: 'Human Resources', description: 'Staff capacity gap', severity: 'Medium' })).toBe('Capacity gaps');
  });
});
