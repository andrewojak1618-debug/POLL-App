import type { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';

import { SurveyQuestionComponent } from './survey_question';
import { SurveyQuestion } from './survey_question_model';
import { SurveyForm } from '../survey_form/survey_form';

describe('Survey questions', (): void => {
  it('keeps answers and multiple selection independent between questions', (): void => {
    const survey = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
    survey.questions.at(0).answers.at(0).setValue('Monday');
    survey.addQuestion();
    survey.questions.at(1).controls.multipleAnswers.setValue(true);
    survey.questions.at(1).addAnswer();
    expect(survey.questions.at(0).answers.getRawValue()).toEqual(['Monday', '']);
    expect(survey.questions.at(0).controls.multipleAnswers.value).toBe(false);
    expect(survey.questions.at(1).answers.length).toBe(4);
  });

  it('removes an additional question while preserving other question content', (): void => {
    const survey = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
    survey.addQuestion();
    survey.addQuestion();
    survey.questions.at(2).controls.question.setValue('Last question');
    survey.removeQuestion(1);
    expect(survey.questions.length).toBe(2);
    expect(survey.questions.at(1).controls.question.value).toBe('Last question');
  });

  it('only clears the first question text and keeps its answers', (): void => {
    const survey = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
    survey.questions.at(0).controls.question.setValue('First question');
    survey.questions.at(0).answers.at(0).setValue('Monday');
    survey.removeQuestion(0);
    expect(survey.questions.length).toBe(1);
    expect(survey.questions.at(0).controls.question.value).toBe('');
    expect(survey.questions.at(0).answers.at(0).value).toBe('Monday');
  });
});

describe('Answer removal focus', (): void => {
  it.each([
    { count: 4, removed: 1, focused: 1, values: ['A', 'C', 'D'] },
    { count: 3, removed: 2, focused: 1, values: ['A', 'B'] },
    { count: 2, removed: 0, focused: 0, values: ['', 'B'] },
  ])('keeps focus after removing answer $removed from $count answers', async ({ count, removed, focused, values }: { count: number; removed: number; focused: number; values: string[]; }): Promise<void> => {
    const fixture = TestBed.createComponent(SurveyQuestionComponent);
    const question: SurveyQuestion = new SurveyQuestion();
    while (question.answers.length < count) question.addAnswer();
    question.answers.controls.forEach((control: FormControl<string>, index: number): void => control.setValue(String.fromCharCode(65 + index)));
    fixture.componentRef.setInput('question', question);
    fixture.componentRef.setInput('number', 1);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    root.querySelectorAll<HTMLButtonElement>('.answer_row button')[removed].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(question.answers.getRawValue()).toEqual(values);
    expect(document.activeElement).toBe(root.querySelectorAll('.answer_row input')[focused]);
  });
});
describe('Question validation', (): void => {
  it.each(['', '   ', '\t\n', '\u00a0'])('rejects empty text in questions and answers: %j', (value: string): void => {
    const question: SurveyQuestion = new SurveyQuestion();
    question.controls.question.setValue(value);
    question.answers.setValue(['Monday', value]);
    expect(question.controls.question.invalid).toBe(true);
    expect(question.answers.invalid).toBe(true);
    expect(question.invalid).toBe(true);
  });

  it('requires at least two answers even when the array is changed directly', (): void => {
    const question: SurveyQuestion = new SurveyQuestion();
    question.controls.question.setValue('When?');
    question.answers.setValue(['Monday', 'Tuesday']);
    expect(question.valid).toBe(true);
    question.answers.removeAt(1);
    expect(question.answers.hasError('minlength')).toBe(true);
    question.answers.clear();
    expect(question.answers.hasError('required')).toBe(true);
  });

  it('validates added answers and keeps the existing removal behavior', (): void => {
    const question: SurveyQuestion = new SurveyQuestion();
    question.controls.question.setValue(' When? ');
    question.answers.setValue([' Monday ', 'Tuesday']);
    question.addAnswer();
    expect(question.invalid).toBe(true);
    question.answers.at(2).setValue('  ');
    expect(question.invalid).toBe(true);
    question.removeAnswer(2);
    expect(question.valid).toBe(true);
    expect(question.answers.at(0).value).toBe(' Monday ');
    question.removeAnswer(0);
    expect(question.answers.length).toBe(2);
    expect(question.invalid).toBe(true);
  });

  it('propagates errors from a further question to the complete form', (): void => {
    const survey: SurveyForm = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
    survey.fields.name.setValue('Team meeting');
    survey.fields.category.setValue('category-id');
    survey.questions.at(0).controls.question.setValue('When?');
    survey.questions.at(0).answers.setValue(['Monday', 'Tuesday']);
    expect(survey.form.valid).toBe(true);
    survey.addQuestion();
    expect(survey.form.invalid).toBe(true);
    survey.questions.at(1).controls.question.setValue('Where?');
    survey.questions.at(1).answers.setValue(['Office', 'Online', 'Outside']);
    expect(survey.form.valid).toBe(true);
    survey.questions.at(1).answers.at(1).setValue('  ');
    expect(survey.form.invalid).toBe(true);
  });
});
describe('Required question fields', (): void => {
  it('marks initial and added question and answer inputs as required', (): void => {
    const fixture = TestBed.createComponent(SurveyForm);
    fixture.componentInstance.addQuestion();
    fixture.componentInstance.questions.at(1).addAnswer();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const groups: NodeListOf<HTMLFieldSetElement> = root.querySelectorAll('fieldset');
    expect(groups.length).toBe(2);
    groups.forEach((group: HTMLFieldSetElement): void => {
      expect(group.querySelector('.question_heading label')?.textContent).not.toContain('*');
      expect(group.querySelector('.answers_heading')?.textContent).toContain('Answers');
      group.querySelectorAll<HTMLInputElement>('input:not([type="checkbox"])').forEach((input: HTMLInputElement): void => {
        expect(input.required).toBe(true);
      });
      expect(group.querySelector<HTMLInputElement>('input[type="checkbox"]')?.required).toBe(false);
    });
    expect(root.querySelectorAll('.answer_row input').length).toBe(6);
  });
});