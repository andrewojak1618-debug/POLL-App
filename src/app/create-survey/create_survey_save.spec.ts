import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { SurveyStore } from '../shared/data/survey_store';
import { CreateSurvey } from './create-survey';
import { SurveyForm } from './survey-form/survey-form';

describe('Creation persistence', () => {
  it.each([true, false])('resets and navigates only after success (success=%s)', async (success: boolean): Promise<void> => {
    const result = success ? { success: true, data: 'new-survey-id' } : { success: false, error: 'request_failed' };
    let confirmSave!: () => void;
    const pending = new Promise<typeof result>((resolve): void => { confirmSave = (): void => resolve(result); });
    const createSurvey = vi.fn().mockReturnValue(pending);
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: SurveyStore, useValue: {
      categories: signal([]), isLoading: signal(false), error: signal(null), isCreating: signal(false), load: vi.fn().mockResolvedValue(undefined), createSurvey,
    } }] });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CreateSurvey);
    fixture.detectChanges();
    const form: SurveyForm = fixture.debugElement.query(By.directive(SurveyForm)).componentInstance;
    form.fields.name.setValue('Meeting');
    form.fields.category.setValue('category-id');
    form.questions.at(0).controls.question.setValue('When?');
    form.questions.at(0).answers.setValue(['Monday', 'Tuesday']);
    const root: HTMLElement = fixture.nativeElement;
    root.querySelector<HTMLButtonElement>('.publish_button')!.click();
    expect(form.fields.name.value).toBe('Meeting');
    expect(navigate).not.toHaveBeenCalled();
    confirmSave();
    await fixture.whenStable();
    expect(createSurvey).toHaveBeenCalledExactlyOnceWith({
      categoryId: 'category-id', title: 'Meeting', description: null, endsAt: null,
      questions: [{ text: 'When?', allowsMultipleAnswers: false, options: [{ text: 'Monday' }, { text: 'Tuesday' }] }],
    });
    expect(fixture.componentInstance.saveResult()).toEqual(result);
    expect(form.fields.name.value).toBe(success ? '' : 'Meeting');
    if (success) {
      expect(navigate).toHaveBeenCalledExactlyOnceWith(['/']);
      expect(form.form.pristine).toBe(true);
      expect(form.form.untouched).toBe(true);
      expect(form.questions.length).toBe(1);
      expect(form.questions.at(0).answers.getRawValue()).toEqual(['', '']);
    } else {
      expect(navigate).not.toHaveBeenCalled();
      expect(form.questions.at(0).answers.getRawValue()).toEqual(['Monday', 'Tuesday']);
    }
    expect(root.querySelector('[role="status"]')?.textContent).toContain(success ? 'Survey published.' : 'Could not publish');
  });
});
it('blocks repeated UI submits while saving and permits a retry after failure', async (): Promise<void> => {
  const isCreating = signal(false);
  let finish!: () => void;
  const createSurvey = vi.fn(() => {
    isCreating.set(true);
    return new Promise((resolve): void => {
      finish = (): void => {
        isCreating.set(false);
        resolve({ success: false, error: 'request_failed' });
      };
    });
  });
  TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: SurveyStore, useValue: {
    categories: signal([]), isLoading: signal(false), error: signal(null), isCreating,
    load: vi.fn().mockResolvedValue(undefined), createSurvey,
  } }] });
  const fixture = TestBed.createComponent(CreateSurvey);
  fixture.detectChanges();
  const form: SurveyForm = fixture.debugElement.query(By.directive(SurveyForm)).componentInstance;
  form.fields.name.setValue('Meeting');
  form.fields.category.setValue('category-id');
  form.questions.at(0).controls.question.setValue('When?');
  form.questions.at(0).answers.setValue(['Monday', 'Tuesday']);
  const root: HTMLElement = fixture.nativeElement;
  const button: HTMLButtonElement = root.querySelector<HTMLButtonElement>('.publish_button')!;
  const nativeForm: HTMLFormElement = root.querySelector<HTMLFormElement>('form')!;
  button.click();
  button.click();
  expect(createSurvey).toHaveBeenCalledOnce();
  fixture.detectChanges();
  expect(button.disabled).toBe(true);
  expect(root.textContent).toContain('Publishing survey');
  button.click();
  nativeForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  nativeForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(createSurvey).toHaveBeenCalledOnce();
  expect(form.fields.name.value).toBe('Meeting');
  finish();
  await fixture.whenStable();
  expect(button.disabled).toBe(false);
  expect(form.fields.name.value).toBe('Meeting');
  button.click();
  expect(createSurvey).toHaveBeenCalledTimes(2);
  finish();
  await fixture.whenStable();
});