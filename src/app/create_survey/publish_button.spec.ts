import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { SurveyStore } from '../shared/data/survey_store';
import { CreateSurvey } from './create_survey';
import { SurveyForm } from './survey_form/survey_form';

describe('Publish button', (): void => {
  it('submits the associated form and displays errors without leaving the page', (): void => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: SurveyStore, useValue: { isLoading: signal(false), error: signal(null), isCreating: signal(false), categories: signal([]), load: vi.fn().mockResolvedValue(undefined) } }] });
    const fixture = TestBed.createComponent(CreateSurvey);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const button: HTMLButtonElement = root.querySelector<HTMLButtonElement>('.publish_button')!;
    const survey: SurveyForm = fixture.debugElement.query(By.directive(SurveyForm)).componentInstance;
    const submit = vi.spyOn(survey, 'submit');
    expect(button.type).toBe('submit');
    expect(button.form?.id).toBe('create_survey_form');
    button.click();
    fixture.detectChanges();
    expect(submit).toHaveBeenCalledOnce();
    expect(survey.form.touched).toBe(true);
    expect(root.querySelector('#survey_name_error')).not.toBeNull();
  });
});
it('loads categories on direct creation entry and stores the selected ID', (): void => {
  const categories = signal([{ id: 'team-id', name: 'Team', slug: 'team' }]);
  const load = vi.fn().mockResolvedValue(undefined);
  TestBed.configureTestingModule({ providers: [provideRouter([]), {
    provide: SurveyStore, useValue: { categories, load, isLoading: signal(false), error: signal(null), isCreating: signal(false) },
  }] });
  const fixture = TestBed.createComponent(CreateSurvey);
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  const select: HTMLSelectElement = root.querySelector<HTMLSelectElement>('#survey_category')!;
  expect(load).toHaveBeenCalledOnce();
  expect(select.labels?.[0].textContent).toBe('Choose category');
  expect(select.hasAttribute('aria-label')).toBe(false);
  expect(select.options[1].text).toBe('Team');
  expect(select.options[1].value).toBe('team-id');
  select.value = 'team-id';
  select.dispatchEvent(new Event('change'));
  const form: SurveyForm = fixture.debugElement.query(By.directive(SurveyForm)).componentInstance;
  expect(form.fields.category.value).toBe('team-id');
  expect(form.fields.category.valid).toBe(true);
  categories.set([{ id: 'team-id', name: 'Renamed team', slug: 'team' }]);
  fixture.detectChanges();
  expect(select.labels?.[0].textContent).toBe('Choose category');
  expect(select.options[1].text).toBe('Renamed team');
  expect(form.fields.category.value).toBe('team-id');
});