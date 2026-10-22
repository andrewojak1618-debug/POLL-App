import { EMPTY } from 'rxjs';
import { SurveyRepository } from '../../shared/data/survey_repository';
import { SurveyRealtime } from '../../shared/data/survey_realtime';
import type { SurveyDetail } from '../../shared/models/survey_detail';
import type { SurveyCategoryData } from '../../shared/models/survey_category_data';
import { SurveyStore } from '../../shared/data/survey_store';

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';

/** Activates a visible control and waits for Angular to finish navigation. */
async function activate(harness: RouterTestingHarness, selector: string): Promise<void> {
  const control: HTMLElement | null | undefined = harness.routeNativeElement?.querySelector(selector);
  expect(control).toBeTruthy();
  control?.click();
  harness.detectChanges();
  await harness.fixture.whenStable();
}

/** Selects a status and category through the rendered Home controls. */
async function selectFilters(harness: RouterTestingHarness): Promise<void> {
  await activate(harness, '[appFilterButton]:nth-child(2)');
  await activate(harness, '.category_trigger');
  await activate(harness, '.category_option:nth-child(2)');
}

describe('Home filters across navigation', () => {
  beforeEach(() => {
    const categories: readonly SurveyCategoryData[] = [
      { id: 'team-id', name: 'Team Activities', slug: 'team_activities' },
      { id: 'gaming-id', name: 'Gaming & Entertainment', slug: 'gaming_entertainment' },
    ];
    const surveys: readonly SurveyDetail[] = categories.flatMap((category: SurveyCategoryData): SurveyDetail[] => [
      { id: category.id + '-active', categoryId: category.id, category, title: 'Gaming habits active ' + category.name,
        description: null, endsAt: null, createdAt: 0, questions: [] },
      { id: category.id + '-past', categoryId: category.id, category, title: 'Past ' + category.name,
        description: null, endsAt: 1, createdAt: 0, questions: [] },
    ]);
    TestBed.configureTestingModule({ providers: [provideRouter(routes),
      { provide: SurveyRepository, useValue: {
        loadCategories: async () => ({ success: true, data: categories }),
        loadSurveys: async () => ({ success: true, data: surveys }),
      } },
      { provide: SurveyRealtime, useValue: { inserts: EMPTY, voteUpdates: EMPTY, start: (): void => {} } },
    ] });
  });  it('keeps Active and Past independent and resets only the visible category', async () => {
    const harness = await RouterTestingHarness.create('/');
    await harness.fixture.whenStable();
    harness.detectChanges();
    const store: SurveyStore = TestBed.inject(SurveyStore);
    await activate(harness, '.category_trigger');
    await activate(harness, '.category_option:nth-child(3)');
    await harness.fixture.whenStable();
    harness.detectChanges();
    await selectFilters(harness);
    expect(store.activeCategoryId()).toBe('gaming-id');
    expect(store.pastCategoryId()).toBe('team-id');
    await activate(harness, '[appFilterButton]:nth-child(1)');
    expect(harness.routeNativeElement?.querySelector('.selected_category')?.textContent).toBe('Gaming & Entertainment');
    expect(harness.routeNativeElement?.querySelector('.survey_grid')?.textContent).toContain('Gaming habits');
    await activate(harness, '.category_trigger');
    await activate(harness, '.category_option:nth-child(1)');
    expect(store.activeCategoryId()).toBeNull();
    expect(store.pastCategoryId()).toBe('team-id');
    await activate(harness, '[appFilterButton]:nth-child(2)');
    expect(harness.routeNativeElement?.querySelector('.selected_category')?.textContent).toBe('Team Activities');
    await activate(harness, '.category_trigger');
    await activate(harness, '.category_option:nth-child(1)');
    expect(store.pastCategoryId()).toBeNull();
  });
  it('preserves status, category and results after Cancel', async () => {
    const harness = await RouterTestingHarness.create('/');
    await harness.fixture.whenStable();
    harness.detectChanges();
    await selectFilters(harness);
    expect(TestBed.inject(SurveyStore).pastCategoryId()).toBe('team-id');
    const results: string | null | undefined = harness.routeNativeElement?.querySelector('.survey_grid')?.textContent;
    const category: string | null | undefined = harness.routeNativeElement?.querySelector('.selected_category')?.textContent;
    await activate(harness, 'a[appPrimaryButton]');
    await activate(harness, '.cancel_button');
    expect(harness.routeNativeElement?.querySelector('[appFilterButton]:nth-child(2)')?.getAttribute('aria-pressed')).toBe('true');
    expect(harness.routeNativeElement?.querySelector('.selected_category')?.textContent).toBe(category);
    expect(harness.routeNativeElement?.querySelector('.survey_grid')?.textContent).toBe(results);
  });

  it('preserves filters when Home is recreated through route navigation', async () => {
    const harness = await RouterTestingHarness.create('/');
    await harness.fixture.whenStable();
    harness.detectChanges();
    await selectFilters(harness);
    expect(TestBed.inject(SurveyStore).pastCategoryId()).toBe('team-id');
    const category: string | null | undefined = harness.routeNativeElement?.querySelector('.selected_category')?.textContent;
    await harness.navigateByUrl('/create-survey');
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement?.querySelector('[appFilterButton]:nth-child(2)')?.getAttribute('aria-pressed')).toBe('true');
    expect(harness.routeNativeElement?.querySelector('.selected_category')?.textContent).toBe(category);
  });
});