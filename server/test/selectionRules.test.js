import { describe, expect, it } from 'vitest';
import {
  assertCanComplete,
  assertCanCreateSelection,
  assertCanUpdateSelection,
  completionStatus
} from '../src/lib/selectionRules.js';

const product = { id: 'product-1' };

function selections(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `selection-${index + 1}`,
    product_service_id: `product-${index + 1}`,
    rank: index + 1,
    rationale: `Rationale ${index + 1}`
  }));
}

describe('selection rules', () => {
  it('allows a team to select one Product & Service', () => {
    expect(() => assertCanCreateSelection({
      selections: [],
      product,
      productServiceId: product.id,
      rank: 1
    })).not.toThrow();
  });

  it('prevents more than five selections', () => {
    expect(() => assertCanCreateSelection({
      selections: selections(5),
      product: { id: 'product-6' },
      productServiceId: 'product-6',
      rank: 5
    })).toThrow(/maximum of five/i);
  });

  it('prevents selecting the same Product & Service twice', () => {
    expect(() => assertCanCreateSelection({
      selections: selections(1),
      product,
      productServiceId: 'product-1',
      rank: 2
    })).toThrow(/already been selected/i);
  });

  it('requires rationale before completion', () => {
    const draft = selections(5);
    draft[2].rationale = '';
    expect(() => assertCanComplete(draft)).toThrow(/rationale/i);
  });

  it('requires unique ranks', () => {
    expect(() => assertCanUpdateSelection({
      selections: selections(3),
      selectionId: 'selection-1',
      rank: 2
    })).toThrow(/rank must be unique/i);
  });

  it('reports executive-friendly completion status labels', () => {
    expect(completionStatus(0)).toBe('0/5 Not started');
    expect(completionStatus(3)).toBe('3/5 In progress');
    expect(completionStatus(5)).toBe('5/5 Ready to complete');
    expect(completionStatus(5, true)).toBe('Completed');
  });
});
