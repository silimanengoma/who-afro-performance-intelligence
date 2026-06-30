import { describe, expect, it } from 'vitest';
import { calculateRegionalKpis, executiveSignal, groupCount, ratio } from '../src/lib/regionalRules.js';

describe('regional intelligence rules', () => {
  it('calculates ratios safely', () => {
    expect(ratio(3, 4)).toBe(75);
    expect(ratio(1, 0)).toBe(0);
  });

  it('groups regional chart counts', () => {
    expect(groupCount([{ c: 'ZMB' }, { c: 'ZMB' }, { c: 'SLE' }], (item) => item.c)).toEqual({ ZMB: 2, SLE: 1 });
  });

  it('calculates regional KPIs', () => {
    const kpis = calculateRegionalKpis({
      assessments: [{ delivery_status: 'Completed' }, { delivery_status: 'Delayed', output_risk_flag: 'At risk' }],
      bottlenecks: [{ category: 'Procurement', severity: 'Critical', escalation_required: true }],
      decisions: [{ status: 'Completed' }, { status: 'In progress' }],
      learnings: [{}, {}],
      submissions: [{}]
    });
    expect(kpis.deliveryAccelerationIndex).toBe(50);
    expect(kpis.procurementConstraintIndex).toBe(100);
    expect(kpis.decisionResponsivenessScore).toBe(50);
  });

  it('derives an executive signal', () => {
    expect(executiveSignal({ countryRiskScore: 12, escalationSeverityIndex: 1, deliveryAccelerationIndex: 80 })).toBe('Executive attention required');
  });
});
