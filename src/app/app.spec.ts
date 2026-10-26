import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { EMPTY } from 'rxjs';
import type { Provider } from '@angular/core';
import { SurveyRealtime } from './shared/data/survey_realtime';
import { SurveyRepository } from './shared/data/survey_repository';

import { App } from './app';
import { routes } from './app.routes';

const DATA_PROVIDERS: Provider[] = [
  { provide: SurveyRealtime, useValue: { inserts: EMPTY, voteUpdates: EMPTY, start: (): void => {} } },
  { provide: SurveyRepository, useValue: {
    loadSurveys: async (): Promise<unknown> => ({ success: true, data: [] }),
    loadCategories: async (): Promise<unknown> => ({ success: true, data: [] }),
    loadSurveyById: async (): Promise<unknown> => ({ success: true, data: null }),
  } },
];

describe('App navigation', (): void => {
  beforeEach(async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), ...DATA_PROVIDERS],
    }).compileComponents();
  });

  it('should open a survey detail URL directly with its page title and heading', async (): Promise<void> => {
    const url: string = '/surveys/00000000-0000-4000-8000-000000000001';
    const harness: RouterTestingHarness = await RouterTestingHarness.create(url);
    expect(TestBed.inject(Router).url).toBe(url);
    expect(document.title).toBe('Survey details | Poll App');
    expect(harness.routeNativeElement?.querySelector('main')?.getAttribute('aria-labelledby'))
      .toBe('survey_detail_title');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Survey details');
  });
  it('should create the app', (): void => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('should open Create Survey using New survey', async (): Promise<void> => {
    const harness = await RouterTestingHarness.create('/');
    const link = harness.routeNativeElement?.querySelector<HTMLAnchorElement>('a[appPrimaryButton]');
    expect(link?.getAttribute('href')).toBe('/create-survey');
    link?.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/create-survey');
    expect(document.activeElement).toBe(harness.routeNativeElement?.querySelector('h1'));
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Create new survey');
  });

  it('should focus the heading when opening Create Survey directly', async (): Promise<void> => {
    const harness = await RouterTestingHarness.create('/create-survey');
    const heading = harness.routeNativeElement?.querySelector('h1');
    expect(document.activeElement).toBe(heading);
    expect(heading?.getAttribute('tabindex')).toBe('-1');
  });
  it('should restore focus after New survey and Cancel', async (): Promise<void> => {
    const harness = await RouterTestingHarness.create('/');
    harness.routeNativeElement?.querySelector<HTMLAnchorElement>('a[appPrimaryButton]')?.click();
    await harness.fixture.whenStable();
    harness.routeNativeElement?.querySelector<HTMLAnchorElement>('.cancel_button')?.click();
    await harness.fixture.whenStable();
    expect(document.activeElement).toBe(harness.routeNativeElement?.querySelector('a[appPrimaryButton]'));
  });

  it('should not focus New survey on a normal Home visit', async (): Promise<void> => {
    const harness = await RouterTestingHarness.create('/');
    expect(document.activeElement).not.toBe(harness.routeNativeElement?.querySelector('a[appPrimaryButton]'));
  });
  it('should return home using Cancel after opening the route directly', async (): Promise<void> => {
    const harness = await RouterTestingHarness.create('/create-survey');
    const cancel = harness.routeNativeElement?.querySelector<HTMLAnchorElement>('.cancel_button');
    cancel?.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(document.activeElement).toBe(harness.routeNativeElement?.querySelector('a[appPrimaryButton]'));
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Collect Feedback,');
  });
});

it('focuses the Home heading after returning from a direct detail entry', async (): Promise<void> => {
  TestBed.configureTestingModule({ providers: [provideRouter(routes), ...DATA_PROVIDERS] });
  const harness: RouterTestingHarness = await RouterTestingHarness.create('/surveys/invalid');
  harness.routeNativeElement?.querySelector<HTMLAnchorElement>('.home_link')?.click();
  await harness.fixture.whenStable();
  expect(TestBed.inject(Router).url).toBe('/');
  const heading: HTMLHeadingElement | null | undefined = harness.routeNativeElement?.querySelector('h1');
  expect(heading?.getAttribute('tabindex')).toBe('-1');
  expect(document.activeElement).toBe(heading);
  expect(heading?.textContent).toContain('Collect Feedback,');
});
