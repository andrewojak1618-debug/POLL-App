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
  const trigger: HTMLButtonElement = root.querySelector<HTMLButtonElement>('#survey_category')!;
  expect(load).toHaveBeenCalledOnce();
  expect(trigger.getAttribute('aria-label')).toBe('Choose category');
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  trigger.click();
  fixture.detectChanges();
  const option: HTMLButtonElement = root.querySelector<HTMLButtonElement>('#create_category_options button')!;
  expect(option.textContent).toContain('Team');
  option.click();
  const form: SurveyForm = fixture.debugElement.query(By.directive(SurveyForm)).componentInstance;
  expect(form.fields.category.value).toBe('team-id');
  expect(form.fields.category.valid).toBe(true);
  categories.set([{ id: 'team-id', name: 'Renamed team', slug: 'team' }]);
  fixture.detectChanges();
  expect(trigger.getAttribute('aria-label')).toBe('Choose category');
  expect(trigger.textContent).toContain('Choose category');
  expect(root.querySelector('#selected_category')?.textContent).toContain('Renamed team');
  expect(form.fields.category.value).toBe('team-id');
});