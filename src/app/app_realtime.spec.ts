import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { App } from './app';
import { SurveyRealtime } from './shared/data/survey_realtime';
import type { SurveyRealtimeError } from './shared/data/survey_realtime';

@Component({ template: '<main><h1>Loaded survey</h1><input aria-label="Answer" value="Kept selection" /></main>' })
class LoadedSurveyView {}

it.each<SurveyRealtimeError>(['channel_error', 'timed_out', 'closed'])('announces %s without replacing the loaded view', async (failure: SurveyRealtimeError): Promise<void> => {
  const error = signal<SurveyRealtimeError | null>(null);
  TestBed.configureTestingModule({ providers: [
    provideRouter([{ path: '', component: LoadedSurveyView }]),
    { provide: SurveyRealtime, useValue: { error } },
  ] });
  const fixture = TestBed.createComponent(App);
  await TestBed.inject(Router).navigateByUrl('/');
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const loadedView: Element | null = root.querySelector('main');
  expect(root.querySelector('[role="status"]')?.textContent).toBe('');
  error.set(failure);
  await fixture.whenStable();
  expect(root.querySelector('[role="status"]')?.textContent).toContain('Live updates are currently unavailable');
  expect(root.querySelector('main')).toBe(loadedView);
  expect(root.querySelector<HTMLInputElement>('input')?.value).toBe('Kept selection');
  error.set(null);
  await fixture.whenStable();
  expect(root.querySelector('[role="status"]')?.textContent).toBe('');
  expect(root.querySelector('main')).toBe(loadedView);
});
