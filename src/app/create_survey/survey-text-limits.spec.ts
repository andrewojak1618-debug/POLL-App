import { TestBed } from '@angular/core/testing';
import { SurveyForm } from './survey_form/survey_form';
import { SurveyQuestion } from './survey_question/survey_question_model';
import { MAX_DESCRIPTION_LENGTH, MAX_QUESTION_LENGTH } from '../shared/models/survey-text-limits';

it.each([MAX_QUESTION_LENGTH, MAX_QUESTION_LENGTH + 1])('validates question length %i without truncation', (length: number): void => {
  const question: SurveyQuestion = new SurveyQuestion();
  question.controls.question.setValue('Q'.repeat(length));
  expect(question.controls.question.valid).toBe(length <= MAX_QUESTION_LENGTH);
  expect(question.controls.question.value.length).toBe(length);
});

it.each([0, MAX_DESCRIPTION_LENGTH, MAX_DESCRIPTION_LENGTH + 1])('validates optional description length %i', (length: number): void => {
  const form: SurveyForm = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
  form.fields.description.setValue('D'.repeat(length));
  expect(form.fields.description.valid).toBe(length <= MAX_DESCRIPTION_LENGTH);
  expect(form.fields.description.value.length).toBe(length);
});
