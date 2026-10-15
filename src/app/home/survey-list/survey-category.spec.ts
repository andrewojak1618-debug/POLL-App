import { describe, expect, it } from 'vitest';
import { createSurveyExamples } from './survey-examples';
import { filterSurveysByCategory } from './survey-category';
import { filterSurveysByStatus } from './survey-status';
import type { SurveyListItem } from './survey-list-item';

const NOW: number = 1000000;
const EXAMPLES: readonly SurveyListItem[] = createSurveyExamples(NOW);

describe('combined survey filters', () => {
  it('combines category and active status', () => {
    const active: readonly SurveyListItem[] = filterSurveysByStatus(EXAMPLES, 'active', NOW);
    expect(filterSurveysByCategory(active, 'Gaming & Entertainment').map((survey: SurveyListItem): string => survey.id)).toEqual(['gaming-1']);
  });

  it('keeps the category when switching to past surveys', () => {
    const past: readonly SurveyListItem[] = filterSurveysByStatus(EXAMPLES, 'past', NOW);
    expect(filterSurveysByCategory(past, 'Gaming & Entertainment').map((survey: SurveyListItem): string => survey.id)).toEqual(['gaming-2']);
    expect(filterSurveysByCategory(past, 'All Surveys')).toEqual(past);
  });

  it('returns an empty list for a category without surveys', () => {
    expect(filterSurveysByCategory(filterSurveysByStatus(EXAMPLES, 'past', NOW), 'Education & Learning')).toEqual([]);
    expect(EXAMPLES).toHaveLength(9);
  });
});
