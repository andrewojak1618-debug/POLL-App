import { TestBed } from '@angular/core/testing';
import { SurveyForm } from './survey_form/survey_form';
import { SurveyQuestion } from './survey_question/survey_question_model';
import { MAX_ANSWER_LENGTH, MAX_SURVEY_NAME_LENGTH } from '../shared/models/survey-text-limits';

it.each([MAX_SURVEY_NAME_LENGTH, MAX_SURVEY_NAME_LENGTH + 1])('validates survey name length %i', (length: number): void => {
  const form: SurveyForm = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
  form.fields.name.setValue('N'.repeat(length));
  expect(form.fields.name.valid).toBe(length <= MAX_SURVEY_NAME_LENGTH);
  expect(form.fields.name.value.length).toBe(length);
});

it.each([MAX_ANSWER_LENGTH, MAX_ANSWER_LENGTH + 1])('validates initial and added answers of length %i', (length: number): void => {
  const question: SurveyQuestion = new SurveyQuestion();
  question.addAnswer();
  for (const answer of question.answers.controls) {
    answer.setValue('A'.repeat(length));
    expect(answer.valid).toBe(length <= MAX_ANSWER_LENGTH);
    expect(answer.value.length).toBe(length);
  }
});
