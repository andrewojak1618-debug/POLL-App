import { filterSurveysByStatus } from '../../home/survey-list/survey-status';
import { getEndingSoonSurveys } from '../../home/survey-highlights/ending-soon';
import type { Survey } from './survey';

const NOW: number = 1_000_000;
const DAY: number = 86_400_000;
const BASE: Survey = {
  id: 'base', categoryId: 'category', title: 'Survey',
  description: null, endsAt: null, createdAt: NOW - DAY,
};
const SURVEYS: readonly Survey[] = Object.freeze([
  Object.freeze({ ...BASE, id: 'unlimited' }),
  Object.freeze({ ...BASE, id: 'outside', endsAt: NOW + DAY + 1 }),
  Object.freeze({ ...BASE, id: 'limit', endsAt: NOW + DAY }),
  Object.freeze({ ...BASE, id: 'now', endsAt: NOW }),
  Object.freeze({ ...BASE, id: 'past', endsAt: NOW - 1 }),
  Object.freeze({ ...BASE, id: 'next', endsAt: NOW + 1 }),
]);

/** Returns IDs for readable comparisons without changing survey objects. */
function ids(surveys: readonly Survey[]): readonly string[] {
  return surveys.map((survey: Survey): string => survey.id);
}

describe('Survey model deadline rules', () => {
  it('keeps missing deadlines and future deadlines active', () => {
    const active: readonly Survey[] = filterSurveysByStatus(SURVEYS, 'active', NOW);
    expect(ids(active)).toEqual(['unlimited', 'outside', 'limit', 'next']);
    expect(active[0]).toBe(SURVEYS[0]);
    expect(active[0].categoryId).toBe('category');
  });

  it('considers the exact deadline expired', () => {
    expect(ids(filterSurveysByStatus(SURVEYS, 'past', NOW))).toEqual(['now', 'past']);
  });

  it('sorts highlights and includes exactly 24 hours without mutating input', () => {
    const highlights: readonly Survey[] = getEndingSoonSurveys(SURVEYS, NOW);
    expect(ids(highlights)).toEqual(['next', 'limit']);
    expect(highlights[0]).toBe(SURVEYS[5]);
    expect(ids(SURVEYS)).toEqual(['unlimited', 'outside', 'limit', 'now', 'past', 'next']);
  });

  it('preserves input order when deadlines are equal', () => {
    const tied: readonly Survey[] = [
      { ...BASE, id: 'first', endsAt: NOW + 1 },
      { ...BASE, id: 'second', endsAt: NOW + 1 },
    ];
    expect(ids(getEndingSoonSurveys(tied, NOW))).toEqual(['first', 'second']);
  });
});