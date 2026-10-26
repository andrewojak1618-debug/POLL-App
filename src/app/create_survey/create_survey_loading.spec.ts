import { Home } from '../home/home';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SurveyStore } from '../shared/data/survey_store';
import { CreateSurvey } from './create_survey';

it('shows loading, retry and saving feedback without discarding entered values', async (): Promise<void> => {
  const isLoading = signal(true);
  const isCreating = signal(false);
  const error = signal<string | null>(null);
  const load = vi.fn().mockResolvedValue(undefined);
  TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: SurveyStore, useValue: {
    categories: signal([]), isLoading, isCreating, error, load,
  } }] });
  const fixture = TestBed.createComponent(CreateSurvey);
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  const status: Element | null = root.querySelector('[role="status"]');
  const title: HTMLInputElement = root.querySelector<HTMLInputElement>('#survey_name')!;
  title.value = 'My draft';
  title.dispatchEvent(new Event('input'));
  expect(root.textContent).toContain('Loading survey data and categories');
  expect(root.querySelector<HTMLButtonElement>('.publish_button')?.disabled).toBe(true);
  isLoading.set(false);
  error.set('request_failed');
  fixture.detectChanges();
  expect(root.querySelector('[role="alert"]')?.textContent).toContain('Could not load');
  root.querySelector<HTMLButtonElement>('.retry_button')!.click();
  expect(load).toHaveBeenCalledTimes(2);
  expect(title.value).toBe('My draft');
  error.set(null);
  isCreating.set(true);
  fixture.detectChanges();
  expect(root.querySelector('[role="status"]')).toBe(status);
  expect(root.textContent).toContain('Publishing survey');
  expect(root.querySelector('[role="alert"]')).toBeNull();
  isCreating.set(false);
  fixture.componentInstance.saveResult.set({ success: false, error: 'request_failed' });
  error.set('request_failed');
  fixture.detectChanges();
  expect(root.querySelector('[role="status"]')).toBe(status);
  expect(root.textContent).toContain('Could not publish');
  expect(root.textContent).not.toContain('Could not load');
  expect(title.value).toBe('My draft');
});
beforeEach((): void => { TestBed.overrideComponent(Home, { set: { template: '', imports: [] } }); });
