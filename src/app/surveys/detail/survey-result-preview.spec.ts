import type { SurveyQuestionDetail } from '../../shared/models/survey_detail';
import { previewSurveyResults } from './survey-result-preview';

const QUESTIONS: readonly SurveyQuestionDetail[] = [{
  id: 'q', surveyId: 'survey', text: 'When?', position: 0, allowsMultipleAnswers: false,
  options: [{ id: 'a', questionId: 'q', position: 0, text: 'Monday', voteCount: 2 }, { id: 'b', questionId: 'q', position: 1, text: 'Tuesday', voteCount: 1 }],
}];

describe('Unsaved result preview', (): void => {
  it('adds one tentative vote without changing stored counts', (): void => {
    const preview: readonly SurveyQuestionDetail[] = previewSurveyResults(QUESTIONS, new Map([['q', ['b']]]), []);
    expect(preview[0].options.map((option): number => option.voteCount)).toEqual([2, 2]);
    expect(QUESTIONS[0].options.map((option): number => option.voteCount)).toEqual([2, 1]);
  });
  it('removes the preview when deselected and does not count saved questions twice', (): void => {
    expect(previewSurveyResults(QUESTIONS, new Map(), [])).toEqual(QUESTIONS);
    expect(previewSurveyResults(QUESTIONS, new Map([['q', ['b']]]), ['q'])).toEqual(QUESTIONS);
  });
});
