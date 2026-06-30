import { describe, expect, it } from 'vitest';
import { initialPilotCountries, onboardingSteps, pilotKpis, readinessScore, trafficLight } from '../src/lib/pilotRules.js';

describe('pilot readiness rules', () => {
  it('configures initial pilot countries', () => {
    expect(initialPilotCountries).toEqual(['Zambia', 'Sierra Leone', 'Chad']);
  });

  it('calculates readiness score', () => {
    expect(readinessScore([{ completed: true }, { completed: false }])).toBe(50);
  });

  it('derives traffic-light status', () => {
    expect(trafficLight({ completion: 90, openIssues: 1 })).toBe('Green');
    expect(trafficLight({ completion: 60, openIssues: 4 })).toBe('Amber');
    expect(trafficLight({ completion: 40 })).toBe('Red');
  });

  it('returns role-based onboarding steps', () => {
    expect(onboardingSteps('team_lead')).toContain('Select Top 5 P/S');
  });

  it('computes pilot KPIs', () => {
    expect(pilotKpis({ analytics: [{ user_id: '1', event_name: 'ai.chat' }], feedback: [], checklist: [{ completed: true }] }).userAdoption).toBe(1);
  });
});
