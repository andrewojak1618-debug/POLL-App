import { TestBed } from '@angular/core/testing';
import { SurveyForm } from './survey-form';

/** Checks that every invalid field references its own existing error message. */
function expectErrorLinks(root: HTMLElement, count: number): void {
  const fields = root.querySelectorAll<HTMLElement>('[aria-invalid="true"]');
  expect(fields.length).toBe(count);
  fields.forEach((field: HTMLElement): void => {
    const ids: string[] = (field.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids.some((id: string): boolean => id.includes('error'))).toBe(true);
    ids.forEach((id: string): void => expect(root.querySelectorAll('#' + id).length).toBe(1));
  });
}

it('keeps error references unique after removing and renumbering questions', async (): Promise<void> => {
  const fixture = TestBed.createComponent(SurveyForm);
  const form: SurveyForm = fixture.componentInstance;
  form.addQuestion();
  form.addQuestion();
  form.submit();
  fixture.changeDetectorRef.markForCheck();
  fixture.detectChanges();
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  expectErrorLinks(root, 11);
  root.querySelector<HTMLButtonElement>('[aria-label="Remove question 2"]')!.click();
  fixture.changeDetectorRef.markForCheck();
  fixture.detectChanges();
  await fixture.whenStable();
  expectErrorLinks(root, 8);
  expect(root.querySelector('#question_error_3')).toBeNull();
  form.fields.name.setValue('Team lunch');
  fixture.changeDetectorRef.markForCheck();
  fixture.detectChanges();
  await fixture.whenStable();
  expect(root.querySelector('#survey_name')?.hasAttribute('aria-invalid')).toBe(false);
  expect(root.querySelector('#survey_name')?.hasAttribute('aria-describedby')).toBe(false);
  expect(root.querySelector('#survey_name_error')).toBeNull();
});

it('links an invalid end date to its message and removes the link after a valid retry', async (): Promise<void> => {
  const fixture = TestBed.createComponent(SurveyForm);
  const form: SurveyForm = fixture.componentInstance;
  form.fields.name.setValue('Team lunch');
  form.fields.category.setValue('category');
  form.questions.at(0).controls.question.setValue('Where?');
  form.questions.at(0).answers.setValue(['Office', 'Outside']);
  form.fields.endDate.setValue('invalid');
  form.submit();
  fixture.changeDetectorRef.markForCheck();
  fixture.detectChanges();
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  expectErrorLinks(root, 1);
  expect(root.querySelector('#survey_end_date')?.getAttribute('aria-describedby')).toBe('survey_end_date_error');
  expect(root.querySelector('#survey_end_date_error')?.textContent).toContain('Enter a valid end date');
  form.fields.endDate.setValue('');
  form.submit();
  fixture.changeDetectorRef.markForCheck();
  fixture.detectChanges();
  await fixture.whenStable();
  expect(root.querySelector('#survey_end_date')?.hasAttribute('aria-invalid')).toBe(false);
  expect(root.querySelector('#survey_end_date')?.hasAttribute('aria-describedby')).toBe(false);
  expect(root.querySelector('#survey_end_date_error')).toBeNull();
});