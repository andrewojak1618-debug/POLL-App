import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Home } from './home';
import { SurveyStore } from '../shared/data/survey_store';
import type { RepositoryError } from '../shared/data/repository_result';
import type { SurveyDetail } from '../shared/models/survey_detail';

const SURVEY: SurveyDetail = {
  id: 'loaded', title: 'Loaded survey', description: null, categoryId: 'category',
  category: { id: 'category', name: 'Team activities', slug: 'team' },
  endsAt: 3600000, createdAt: 0, questions: [],
};

it.each([false, true])('replaces loading with completed results (populated: %s)', async (populated: boolean): Promise<void> => {
  const isLoading = signal(false);
  const error = signal<RepositoryError | null>(null);
  const surveys = signal<readonly SurveyDetail[]>([]);
  const load = vi.fn((): Promise<void> => { error.set(null); isLoading.set(true); return Promise.resolve(); });
  TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: SurveyStore, useValue: {
    load, isLoading, error, categories: signal([]), now: signal(0),
    endingSoonSurveys: surveys, filteredActiveSurveys: surveys, filteredPastSurveys: signal([]),
    activeCategoryId: signal(null), pastCategoryId: signal(null),
  } }] });
  const fixture = TestBed.createComponent(Home);
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  expect(load).toHaveBeenCalledOnce();
  expect(root.querySelector('[role="status"]')?.textContent).toContain('Loading surveys and categories');
  expect(root.querySelector('app-survey-list')).toBeNull();
  expect(root.querySelector('app-survey-highlights')).toBeNull();
  expect(root.querySelector('a[routerLink="/create-survey"]')).not.toBeNull();
  error.set('request_failed');
  await fixture.whenStable();
  expect(root.querySelector('[role="alert"]')).toBeNull();
  isLoading.set(false);
  await fixture.whenStable();
  expect(root.querySelector('[role="alert"]')?.textContent).toContain('Could not load surveys and categories');
  expect(root.textContent).not.toContain('Loading surveys and categories');
  expect(root.querySelectorAll('.empty_state').length).toBe(0);
  expect(root.querySelector('app-survey-list')).toBeNull();
  expect(root.querySelector('app-survey-highlights')).toBeNull();
  root.querySelector<HTMLButtonElement>('.retry_button')!.click();
  expect(load).toHaveBeenCalledTimes(2);
  await fixture.whenStable();
  expect(root.querySelector('[role="alert"]')).toBeNull();
  expect(root.querySelector('[role="status"]')?.textContent).toContain('Loading surveys and categories');
  expect(root.querySelector('.retry_button')).toBeNull();
  error.set('request_failed');
  isLoading.set(false);
  await fixture.whenStable();
  expect(root.querySelector('.retry_button')?.textContent).toContain('Try again');
  root.querySelector<HTMLButtonElement>('.retry_button')!.click();
  expect(load).toHaveBeenCalledTimes(3);
  surveys.set(populated ? [SURVEY] : []);
  isLoading.set(false);
  await fixture.whenStable();
  expect(root.textContent).not.toContain('Loading surveys and categories');
  expect(root.querySelector('app-survey-list')).not.toBeNull();
  expect(root.querySelector('app-survey-highlights')).not.toBeNull();
  expect(root.querySelector('.retry_button')).toBeNull();
  expect(root.textContent).toContain(populated ? 'Loaded survey' : 'No active surveys yet.');
  expect(root.querySelectorAll('.empty_state').length).toBe(populated ? 0 : 2);
});
