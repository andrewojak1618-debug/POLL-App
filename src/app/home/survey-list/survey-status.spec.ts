import { describe, expect, it } from 'vitest';
import { filterSurveysByStatus } from './survey-status';
import { createSurveyExamples } from './survey-examples';
import type { SurveyListItem } from './survey-list-item';

const NOW: number = 1000000;
const BASE: SurveyListItem = { id: 'survey', category: 'Team Activities', title: 'Test', deadlineLabel: '', endsAt: null };
const SURVEYS: readonly SurveyListItem[] = [
  { ...BASE, id: 'future', endsAt: NOW + 1 },
  { ...BASE, id: 'boundary', endsAt: NOW },
  { ...BASE, id: 'past', endsAt: NOW - 1 },
  { ...BASE, id: 'open', endsAt: null },
];

describe('survey status filtering', () => {
  it('keeps future and unlimited surveys active', () => {
    expect(filterSurveysByStatus(SURVEYS, 'active', NOW).map((survey: SurveyListItem): string => survey.id)).toEqual(['future', 'open']);
  });

  it('includes the exact deadline in past surveys', () => {
    expect(filterSurveysByStatus(SURVEYS, 'past', NOW).map((survey: SurveyListItem): string => survey.id)).toEqual(['boundary', 'past']);
  });

  it('does not mutate input and handles an empty list', () => {
    expect(filterSurveysByStatus([], 'past', NOW)).toEqual([]);
    filterSurveysByStatus(SURVEYS, 'active', NOW);
    expect(SURVEYS).toHaveLength(4);
  });

  it('provides both statuses in the local examples', () => {
    const examples: readonly SurveyListItem[] = createSurveyExamples(NOW);
    expect(filterSurveysByStatus(examples, 'active', NOW)).toHaveLength(6);
    expect(filterSurveysByStatus(examples, 'past', NOW)).toHaveLength(3);
  });
});
