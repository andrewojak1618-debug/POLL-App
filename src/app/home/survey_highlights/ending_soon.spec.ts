import { describe, expect, it } from 'vitest';

import { getEndingSoonSurveys } from './ending_soon';
import type { SurveyListItem } from '../survey_list/survey_list_item';

const NOW: number = 1000000;
const DAY: number = 86400000;
const BASE: SurveyListItem = { id: 'base', category: 'Team Activities', title: 'Test', deadlineLabel: '', endsAt: null };
const SURVEYS: readonly SurveyListItem[] = [
  { ...BASE, id: 'limit', endsAt: NOW + DAY },
  { ...BASE, id: 'expired', endsAt: NOW - 1 },
  { ...BASE, id: 'ending-now', endsAt: NOW },
  { ...BASE, id: 'too-late', endsAt: NOW + DAY + 1 },
  { ...BASE, id: 'soon', endsAt: NOW + 1 },
  { ...BASE, id: 'unlimited' },
];

describe('ending soon surveys', (): void => {
  it('includes later deadlines while excluding expired and unlimited surveys', (): void => {
    expect(getEndingSoonSurveys(SURVEYS, NOW).map((survey: SurveyListItem): string => survey.id)).toEqual(['soon', 'limit', 'too-late']);
    expect(SURVEYS[0].id).toBe('limit');
  });

  it('updates eligibility as time passes', (): void => {
    expect(getEndingSoonSurveys(SURVEYS, NOW + 1).map((survey: SurveyListItem): string => survey.id)).toEqual(['limit', 'too-late']);
  });

  it('handles empty results', (): void => {
    expect(getEndingSoonSurveys([], NOW)).toEqual([]);
    expect(getEndingSoonSurveys(SURVEYS, NOW + 2 * DAY)).toEqual([]);
  });
});

it('shows at most four upcoming deadlines even when all are beyond tomorrow', (): void => {
  const surveys: readonly SurveyListItem[] = [6, 2, 5, 3, 4].map((days: number): SurveyListItem => ({
    ...BASE, id: String(days), endsAt: NOW + days * DAY,
  }));
  expect(getEndingSoonSurveys(surveys, NOW).map((survey: SurveyListItem): string => survey.id)).toEqual(['2', '3', '4', '5']);
  expect(surveys[0].id).toBe('6');
});
