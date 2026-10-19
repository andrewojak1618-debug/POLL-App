import { TestBed } from '@angular/core/testing';
import { SurveyQuestionComponent } from './survey_question';
import { SurveyQuestion } from './survey_question_model';
import { SurveyForm } from '../survey-form/survey-form';

describe('Survey questions', () => {
  it('keeps answers and multiple selection independent between questions', () => {
    const survey = new SurveyForm();
    survey.questions.at(0).answers.at(0).setValue('Monday');
    survey.addQuestion();
    survey.questions.at(1).controls.multipleAnswers.setValue(true);
    survey.questions.at(1).addAnswer();
    expect(survey.questions.at(0).answers.getRawValue()).toEqual(['Monday', '']);
    expect(survey.questions.at(0).controls.multipleAnswers.value).toBe(false);
    expect(survey.questions.at(1).answers.length).toBe(3);
  });

  it('removes an additional question while preserving other question content', () => {
    const survey = new SurveyForm();
    survey.addQuestion();
    survey.addQuestion();
    survey.questions.at(2).controls.question.setValue('Last question');
    survey.removeQuestion(1);
    expect(survey.questions.length).toBe(2);
    expect(survey.questions.at(1).controls.question.value).toBe('Last question');
  });

  it('only clears the first question text and keeps its answers', () => {
    const survey = new SurveyForm();
    survey.questions.at(0).controls.question.setValue('First question');
    survey.questions.at(0).answers.at(0).setValue('Monday');
    survey.removeQuestion(0);
    expect(survey.questions.length).toBe(1);
    expect(survey.questions.at(0).controls.question.value).toBe('');
    expect(survey.questions.at(0).answers.at(0).value).toBe('Monday');
  });
});

describe('Answer removal focus', () => {
  it.each([
    { count: 4, removed: 1, focused: 1, values: ['A', 'C', 'D'] },
    { count: 3, removed: 2, focused: 1, values: ['A', 'B'] },
    { count: 2, removed: 0, focused: 0, values: ['', 'B'] },
  ])('keeps focus after removing answer $removed from $count answers', async ({ count, removed, focused, values }) => {
    const fixture = TestBed.createComponent(SurveyQuestionComponent);
    const question: SurveyQuestion = new SurveyQuestion();
    while (question.answers.length < count) question.addAnswer();
    question.answers.controls.forEach((control, index): void => control.setValue(String.fromCharCode(65 + index)));
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