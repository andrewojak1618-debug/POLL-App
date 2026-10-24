import { describe, expect, it } from 'vitest';

import { filterSurveysByStatus } from './survey_status';
import { createSurveyExamples } from './survey_examples';
import type { SurveyListItem } from './survey_list_item';

const NOW: number = 1000000;
const BASE: SurveyListItem = { id: 'survey', category: 'Team Activities', title: 'Test', deadlineLabel: '', endsAt: null };
const SURVEYS: readonly SurveyListItem[] = [
  { ...BASE, id: 'future', endsAt: NOW + 1 },
  { ...BASE, id: 'boundary', endsAt: NOW },
  { ...BASE, id: 'past', endsAt: NOW - 1 },
  { ...BASE, id: 'open', endsAt: null },
];

describe('survey status filtering', (): void => {
  it('keeps future and unlimited surveys active', (): void => {
    expect(filterSurveysByStatus(SURVEYS, 'active', NOW).map((survey: SurveyListItem): string => survey.id)).toEqual(['future', 'open']);
  });

  it('includes the exact deadline in past surveys', (): void => {
    expect(filterSurveysByStatus(SURVEYS, 'past', NOW).map((survey: SurveyListItem): string => survey.id)).toEqual(['boundary', 'past']);
  });

  it('does not mutate input and handles an empty list', (): void => {
    expect(filterSurveysByStatus([], 'past', NOW)).toEqual([]);
    filterSurveysByStatus(SURVEYS, 'active', NOW);
    expect(SURVEYS).toHaveLength(4);
  });

  it('provides both statuses in the local examples', (): void => {
    const examples: readonly SurveyListItem[] = createSurveyExamples(NOW);
    expect(filterSurveysByStatus(examples, 'active', NOW)).toHaveLength(6);
    expect(filterSurveysByStatus(examples, 'past', NOW)).toHaveLength(3);
  });
});
