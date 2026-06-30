import { describe, expect, it } from 'vitest';
import {
  assessmentWarnings,
  validateAssessmentComplete,
  validateAssessmentDraft
} from '../src/lib/assessmentRules.js';

const completeAssessment = {
  deliveryStatus: 'On track',
  progressPercentage: 65,
  plannedDeliverable: 'Train district teams',
  actualDeliverable: 'Eight district teams trained',
  evidenceSource: 'Monthly implementation report',
  dataConfidence: 'Confirmed',
  contributionNarrative: 'The training improved district readiness and moved the output forward through expanded implementation capacity.',
  contributionStrength: 'Strong',
  outputRiskFlag: 'On track'
};

describe('assessment rules', () => {
  it('allows a selected Product & Service assessment to be saved as draft', () => {
    expect(() => validateAssessmentDraft({ progressPercentage: 20 })).not.toThrow();
  });

  it('blocks progress percentage above 100', () => {
    expect(() => validateAssessmentDraft({ progressPercentage: 120 })).toThrow(/between 0 and 100/i);
  });

  it('blocks completion when mandatory fields are missing', () => {
    expect(() => validateAssessmentComplete({ deliveryStatus: 'On track' }, 'Output 1')).toThrow(/required fields/i);
  });

  it('requires contribution narrative before completion', () => {
    expect(() => validateAssessmentComplete({ ...completeAssessment, contributionNarrative: '' }, 'Output 1')).toThrow(/Contribution narrative/i);
  });

  it('requires contribution to be linked to a GPW14 Output', () => {
    expect(() => validateAssessmentComplete(completeAssessment, '')).toThrow(/Related GPW14 Output/i);
  });

  it('shows warnings for status and progress inconsistencies', () => {
    expect(assessmentWarnings({ deliveryStatus: 'Completed', progressPercentage: 80, dataConfidence: 'Unavailable' })).toEqual([
      'Delivery status is Completed, but progress is not 100%.',
      'Data confidence is Unavailable; this may affect submission quality.'
    ]);
  });
});
