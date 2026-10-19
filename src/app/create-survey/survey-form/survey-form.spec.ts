import { SurveyQuestion } from '../survey_question/survey_question_model';

describe('Survey answers', () => {
  it('adds an empty answer without changing existing values', () => {
    const survey = new SurveyQuestion();
    survey.answers.at(0).setValue('Monday');
    survey.addAnswer();
    expect(survey.answers.getRawValue()).toEqual(['Monday', '', '']);
  });

  it('removes the selected answer and preserves the other answers', () => {
    const survey = new SurveyQuestion();
    survey.addAnswer();
    survey.answers.setValue(['Monday', 'Tuesday', 'Wednesday']);
    survey.removeAnswer(1);
    expect(survey.answers.getRawValue()).toEqual(['Monday', 'Wednesday']);
  });

  it('keeps two answer fields when clearing an answer', () => {
    const survey = new SurveyQuestion();
    survey.answers.setValue(['Monday', 'Tuesday']);
    survey.removeAnswer(0);
    expect(survey.answers.getRawValue()).toEqual(['', 'Tuesday']);
  });

  it('continues alphabetical labels beyond Z', () => {
    const survey = new SurveyQuestion();
    expect(survey.answerLabel(25)).toBe('Z');
    expect(survey.answerLabel(26)).toBe('AA');
    expect(survey.answerLabel(27)).toBe('AB');
  });
});
