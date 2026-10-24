import { filterSurveysByStatus } from '../../home/survey_list/survey_status';
import { getEndingSoonSurveys } from '../../home/survey_highlights/ending_soon';
import type { SurveyDetail, SurveyQuestionDetail } from './survey_detail';
import type { SurveyOption } from './survey_option';

const NOW: number = Date.UTC(2026, 9, 19, 10);
const EXAMPLE: SurveyDetail = {
  id: 'survey_team_event',
  categoryId: 'category_team',
  category: { id: 'category_team', name: 'Team Activities', slug: 'team-activities' },
  title: 'Plan our next team event',
  description: 'Choose one day and the activities you would enjoy.',
  createdAt: NOW - 86_400_000,
  endsAt: NOW + 3_600_000,
  questions: [
    {
      id: 'question_day', surveyId: 'survey_team_event', text: 'Which day works best?',
      position: 0, allowsMultipleAnswers: false,
      options: [
        { id: 'option_monday', questionId: 'question_day', text: 'Monday', position: 0, voteCount: 2 },
        { id: 'option_friday', questionId: 'question_day', text: 'Friday', position: 1, voteCount: 3 },
      ],
    },
    {
      id: 'question_activities', surveyId: 'survey_team_event', text: 'Which activities do you enjoy?',
      position: 1, allowsMultipleAnswers: true,
      options: [
        { id: 'option_walk', questionId: 'question_activities', text: 'A walk', position: 0, voteCount: 2 },
        { id: 'option_games', questionId: 'question_activities', text: 'Board games', position: 1, voteCount: 4 },
        { id: 'option_dinner', questionId: 'question_activities', text: 'Dinner', position: 2, voteCount: 1 },
      ],
    },
  ],
};

/**
 * Checks the example's option relationships and order, not incoming backend data.
 * @param question - Example question whose answer relationships and positions are checked.
 */
function checkOptions(question: SurveyQuestionDetail): void {
  expect(question.options.length).toBeGreaterThanOrEqual(2);
  question.options.forEach((option: SurveyOption, index: number): void => {
    expect(option.questionId).toBe(question.id);
    expect(option.position).toBe(index);
    expect(option.text.trim()).not.toBe('');
    expect(Number.isInteger(option.voteCount)).toBe(true);
    expect(option.voteCount).toBeGreaterThanOrEqual(0);
  });
}

describe('Complete survey model example', (): void => {
  it('represents independent single-choice and multiple-choice questions', (): void => {
    expect(EXAMPLE.questions.map((question: SurveyQuestionDetail): boolean => question.allowsMultipleAnswers))
      .toEqual([false, true]);
    expect(EXAMPLE.questions[0].options).not.toBe(EXAMPLE.questions[1].options);
    expect(EXAMPLE.questions.map((question: SurveyQuestionDetail): number => question.options.length))
      .toEqual([2, 3]);
  });

  it('uses unique IDs, correct parent relationships and ordered positions', (): void => {
    expect(EXAMPLE.category.id).toBe(EXAMPLE.categoryId);
    const ids: string[] = [EXAMPLE.id, EXAMPLE.category.id];
    EXAMPLE.questions.forEach((question: SurveyQuestionDetail, index: number): void => {
      expect(question.surveyId).toBe(EXAMPLE.id);
      expect(question.position).toBe(index);
      expect(question.text.trim()).not.toBe('');
      checkOptions(question);
      ids.push(question.id, ...question.options.map((option: SurveyOption): string => option.id));
    });
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('preserves the complete nested data through the existing status and highlight logic', (): void => {
    const active: readonly SurveyDetail[] = filterSurveysByStatus([EXAMPLE], 'active', NOW);
    const highlights: readonly SurveyDetail[] = getEndingSoonSurveys(active, NOW);
    expect(highlights[0]).toBe(EXAMPLE);
    expect(highlights[0].questions[1].options[2].text).toBe('Dinner');
    expect(filterSurveysByStatus([EXAMPLE], 'past', NOW + 3_600_000)).toEqual([EXAMPLE]);
    expect(getEndingSoonSurveys([EXAMPLE], NOW + 3_600_000)).toEqual([]);
  });

  it('supports omitted description and deadline without losing questions', (): void => {
    const unlimited: SurveyDetail = { ...EXAMPLE, description: null, endsAt: null };
    expect(filterSurveysByStatus([unlimited], 'active', NOW)[0].questions).toBe(EXAMPLE.questions);
    expect(getEndingSoonSurveys([unlimited], NOW)).toEqual([]);
  });
});