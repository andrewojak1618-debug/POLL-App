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
  it('includes exactly 24 hours, excludes expired and unlimited surveys, and sorts by deadline', (): void => {
    expect(getEndingSoonSurveys(SURVEYS, NOW).map((survey: SurveyListItem): string => survey.id)).toEqual(['soon', 'limit']);
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
