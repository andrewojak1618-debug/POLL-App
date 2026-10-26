import { TestBed } from '@angular/core/testing';

import { SurveyForm } from './survey_form';
import { SurveyQuestion } from '../survey_question/survey_question_model';

describe('Survey answers', (): void => {
  it('adds an empty answer without changing existing values', (): void => {
    const survey = new SurveyQuestion();
    survey.answers.at(0).setValue('Monday');
    survey.addAnswer();
    expect(survey.answers.getRawValue()).toEqual(['Monday', '', '']);
  });

  it('removes the selected answer and preserves the other answers', (): void => {
    const survey = new SurveyQuestion();
    survey.addAnswer();
    survey.answers.setValue(['Monday', 'Tuesday', 'Wednesday']);
    survey.removeAnswer(1);
    expect(survey.answers.getRawValue()).toEqual(['Monday', '', 'Wednesday']);
    survey.removeAnswer(1);
    expect(survey.answers.getRawValue()).toEqual(['Monday', 'Wednesday']);
  });

  it('keeps two answer fields when clearing an answer', (): void => {
    const survey = new SurveyQuestion();
    survey.answers.setValue(['Monday', 'Tuesday']);
    survey.removeAnswer(0);
    expect(survey.answers.getRawValue()).toEqual(['', 'Tuesday']);
  });

  it('continues alphabetical labels beyond Z', (): void => {
    const survey = new SurveyQuestion();
    expect(survey.answerLabel(25)).toBe('Z');
    expect(survey.answerLabel(26)).toBe('AA');
    expect(survey.answerLabel(27)).toBe('AB');
  });
});

describe('Survey name', (): void => {
  it.each(['', '   ', '\t\n', '\u00a0'])('rejects an empty or whitespace-only title: %j', (value: string): void => {
    const survey: SurveyForm = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
    survey.fields.name.setValue(value);
    expect(survey.fields.name.invalid).toBe(true);
    expect(survey.form.invalid).toBe(true);
  });

  it('accepts a title containing text without changing its value', (): void => {
    const survey: SurveyForm = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
    survey.fields.name.setValue('  Team lunch  ');
    expect(survey.fields.name.valid).toBe(true);
    expect(survey.fields.name.value).toBe('  Team lunch  ');
    survey.fields.name.reset();
    expect(survey.fields.name.invalid).toBe(true);
  });

  it('keeps native required semantics without a visible marker', async (): Promise<void> => {
    await TestBed.configureTestingModule({ imports: [SurveyForm] }).compileComponents();
    const fixture = TestBed.createComponent(SurveyForm);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('label[for="survey_name"]')?.textContent).not.toContain('*');
    expect(element.querySelector<HTMLInputElement>('#survey_name')?.required).toBe(true);
  });
});
describe('Survey category', (): void => {
  it('requires a selection and becomes invalid again after resetting', (): void => {
    const survey: SurveyForm = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
    survey.fields.name.setValue('Team lunch');
    expect(survey.fields.category.hasError('required')).toBe(true);
    expect(survey.form.invalid).toBe(true);
    survey.fields.category.setValue('category-id');
    expect(survey.fields.category.valid).toBe(true);
    survey.fields.category.reset();
    expect(survey.fields.category.value).toBe('');
    expect(survey.fields.category.hasError('required')).toBe(true);
    expect(survey.form.invalid).toBe(true);
  });

  it('keeps the category required without a visible marker', async (): Promise<void> => {
    await TestBed.configureTestingModule({ imports: [SurveyForm] }).compileComponents();
    const fixture = TestBed.createComponent(SurveyForm);
    fixture.componentInstance.fields.category.setValue('category-id');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const trigger: HTMLButtonElement | null = element.querySelector('#survey_category');
    expect(fixture.componentInstance.fields.category.valid).toBe(true);
    expect(trigger?.getAttribute('aria-describedby')).toBe('selected_category');
    expect(element.querySelector('#category_requirement')).toBeNull();
  });
});
describe('Validation feedback', (): void => {
  it('shows errors after interaction and removes them when corrected', (): void => {
    const fixture = TestBed.createComponent(SurveyForm);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('.field_error').length).toBe(0);
    const input: HTMLInputElement = root.querySelector<HTMLInputElement>('#survey_name')!;
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(root.querySelector('#survey_name_error')?.textContent).toContain('Enter a survey name');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    input.value = 'Team lunch';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(root.querySelector('#survey_name_error')).toBeNull();
  });

  it('shows field-specific errors for all questions after a submit attempt', (): void => {
    const fixture = TestBed.createComponent(SurveyForm);
    fixture.componentInstance.addQuestion();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    root.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(root.querySelector('#survey_category_error')?.textContent).toContain('Choose a category');
    expect(root.querySelector('#question_error_2')?.textContent).toContain('Enter a question');
    expect(root.querySelector('#answer_error_2_1')?.textContent).toContain('Enter answer B');
    expect(root.querySelectorAll('.field_error').length).toBe(9);
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });
});
describe('Submit validation guard', (): void => {
  it('marks nested invalid fields touched without clearing entered values', (): void => {
    const survey: SurveyForm = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
    survey.fields.name.setValue('Team lunch');
    survey.addQuestion();
    survey.questions.at(1).answers.at(0).setValue('Online');
    const before = survey.form.getRawValue();
    survey.submit();
    expect(survey.fields.category.touched).toBe(true);
    expect(survey.questions.at(1).controls.question.touched).toBe(true);
    expect(survey.questions.at(1).answers.at(1).touched).toBe(true);
    expect(survey.form.invalid).toBe(true);
    expect(survey.form.getRawValue()).toEqual(before);
  });

  it('does not mark a valid form touched or reset it on submit', (): void => {
    const survey: SurveyForm = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
    survey.fields.name.setValue('Team lunch');
    survey.fields.category.setValue('category-id');
    survey.questions.at(0).controls.question.setValue('Where?');
    survey.questions.at(0).answers.setValue(['Office', 'Online']);
    const before = survey.form.getRawValue();
    survey.submit();
    expect(survey.form.valid).toBe(true);
    expect(survey.form.untouched).toBe(true);
    expect(survey.form.getRawValue()).toEqual(before);
  });
});