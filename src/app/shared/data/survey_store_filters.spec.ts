import { EMPTY } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SurveyRealtime } from './survey_realtime';
import { SurveyRepository } from './survey_repository';
import { SurveyStore } from './survey_store';
import type { SurveyDetail } from '../models/survey_detail';

const NOW: number = Date.parse('2026-10-21T12:00:00Z');

/**
 * Creates a model for testing independent status and category filtering.
 * @param id - Identifier of the test survey.
 * @param categoryId - Category identifier used for filtering.
 * @param endsAt - Deadline in Unix milliseconds, or null for an unlimited survey.
 * @returns A survey fixture with the requested identity, category and deadline.
 */
function survey(id: string, categoryId: string, endsAt: number | null): SurveyDetail {
  return { id, categoryId, endsAt, title: 'Activity', description: null, createdAt: NOW - 5000,
    category: { id: categoryId, name: categoryId, slug: categoryId }, questions: [] };
}

const ROWS: readonly SurveyDetail[] = [
  survey('active_a', 'a', NOW + 1000), survey('active_b', 'b', null),
  survey('past_a', 'a', NOW - 1000), survey('past_b', 'b', NOW),
];

/**
 * Extracts identifiers to make list expectations readable.
 * @param surveys - Survey models in the order to compare.
 * @returns Survey identifiers in the original list order.
 */
function ids(surveys: readonly SurveyDetail[]): readonly string[] {
  return surveys.map((item: SurveyDetail): string => item.id);
}

describe('SurveyStore filtered lists', (): void => {
  const loadSurveys = vi.fn();
  let store: SurveyStore;

  beforeEach(async (): Promise<void> => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    loadSurveys.mockReset().mockResolvedValue({ success: true, data: ROWS });
    TestBed.configureTestingModule({ providers: [{ provide: SurveyRealtime, useValue: { inserts: EMPTY, voteUpdates: EMPTY, start: (): void => {} } }, { provide: SurveyRepository, useValue: {
      loadSurveys, loadCategories: vi.fn().mockResolvedValue({ success: true, data: [] }),
    } }] });
    store = TestBed.inject(SurveyStore);
    await store.load();
  });

  afterEach((): void => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('filters each status independently and resets to all categories', (): void => {
    expect(ids(store.filteredActiveSurveys())).toEqual(['active_a', 'active_b']);
    expect(ids(store.filteredPastSurveys())).toEqual(['past_a', 'past_b']);
    store.selectActiveCategory('a');
    store.selectPastCategory('b');
    expect(ids(store.filteredActiveSurveys())).toEqual(['active_a']);
    expect(ids(store.filteredPastSurveys())).toEqual(['past_b']);
    store.selectActiveCategory(null);
    expect(ids(store.filteredActiveSurveys())).toEqual(['active_a', 'active_b']);
    expect(ids(store.filteredPastSurveys())).toEqual(['past_b']);
    store.selectPastCategory(null);
    expect(ids(store.filteredPastSurveys())).toEqual(['past_a', 'past_b']);
    expect(store.surveys()).toEqual(ROWS);
  });

  it('returns no matches for an absent category without mixing statuses', (): void => {
    store.selectActiveCategory('missing');
    store.selectPastCategory('missing');
    expect(store.filteredActiveSurveys()).toEqual([]);
    expect(store.filteredPastSurveys()).toEqual([]);
  });

  it('moves expired surveys using the separate category selections', (): void => {
    store.selectActiveCategory('a');
    store.selectPastCategory('b');
    vi.advanceTimersByTime(1000);
    expect(store.filteredActiveSurveys()).toEqual([]);
    expect(ids(store.filteredPastSurveys())).toEqual(['past_b']);
    store.selectPastCategory('a');
    expect(ids(store.filteredPastSurveys())).toEqual(['active_a', 'past_a']);
    expect(loadSurveys).toHaveBeenCalledTimes(1);
    expect(store.surveys()).toEqual(ROWS);
  });

  it('recomputes after reloading while preserving selections', async (): Promise<void> => {
    store.selectActiveCategory('a');
    store.selectPastCategory('b');
    loadSurveys.mockResolvedValue({ success: true, data: [] });
    await store.load();
    expect(store.filteredActiveSurveys()).toEqual([]);
    expect(store.filteredPastSurveys()).toEqual([]);
    expect(store.activeCategoryId()).toBe('a');
    expect(store.pastCategoryId()).toBe('b');
  });
});
