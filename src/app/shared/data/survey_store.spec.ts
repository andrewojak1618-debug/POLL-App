import { EMPTY } from 'rxjs';
import { SurveyRealtime } from './survey_realtime';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SurveyRepository } from './survey_repository';
import { SurveyStore } from './survey_store';
import type { RepositoryResult } from './repository_result';
import type { SurveyCategoryData } from '../models/survey_category_data';

const categories: readonly SurveyCategoryData[] = [{
  id: '00000000-0000-4000-8000-000000000001', name: 'Team', slug: 'team',
}];

describe('SurveyStore loading', () => {
  const loadSurveys = vi.fn();
  const loadCategories = vi.fn();
  let store: SurveyStore;

  beforeEach(() => {
    loadSurveys.mockReset().mockResolvedValue({ success: true, data: [] });
    loadCategories.mockReset().mockResolvedValue({ success: true, data: categories });
    TestBed.configureTestingModule({
      providers: [{ provide: SurveyRealtime, useValue: { inserts: EMPTY, voteUpdates: EMPTY, start: (): void => {} } }, { provide: SurveyRepository, useValue: { loadSurveys, loadCategories } }],
    });
    store = TestBed.inject(SurveyStore);
  });

  it('loads data and accepts empty lists', async () => {
    expect(store.isLoading()).toBe(false);
    await store.load();
    expect(store.categories()).toEqual(categories);
    expect(store.surveys()).toEqual([]);
    expect(store.error()).toBeNull();
    expect(store.isLoading()).toBe(false);
    loadCategories.mockResolvedValue({ success: true, data: [] });
    await store.load();
    expect(store.categories()).toEqual([]);
  });

  it('waits for both requests and prevents duplicate concurrent loads', async () => {
    let finish!: (result: RepositoryResult<readonly SurveyCategoryData[]>) => void;
    loadCategories.mockReturnValue(new Promise<RepositoryResult<readonly SurveyCategoryData[]>>((resolve) => {
      finish = resolve;
    }));
    const pending: Promise<void> = store.load();
    expect(store.isLoading()).toBe(true);
    await store.load();
    expect(loadSurveys).toHaveBeenCalledTimes(1);
    expect(loadCategories).toHaveBeenCalledTimes(1);
    expect(store.categories()).toEqual([]);
    finish({ success: true, data: categories });
    await pending;
    expect(store.categories()).toEqual(categories);
    expect(store.isLoading()).toBe(false);
  });

  it.each(['surveys', 'categories'])('preserves both datasets after a %s failure and allows retry', async (source: string) => {
    await store.load();
    loadCategories.mockResolvedValue({ success: true, data: [] });
    const failing = source === 'surveys' ? loadSurveys : loadCategories;
    failing.mockResolvedValueOnce({ success: false, error: 'invalid_data' });
    await store.load();
    expect(store.error()).toBe('invalid_data');
    expect(store.categories()).toEqual(categories);
    expect(store.isLoading()).toBe(false);
    const retry: Promise<void> = store.load();
    expect(store.error()).toBeNull();
    await retry;
    expect(store.categories()).toEqual([]);
  });

  it('handles unexpected rejection and resets loading', async () => {
    loadSurveys.mockRejectedValue(new Error('unexpected'));
    await store.load();
    expect(store.error()).toBe('request_failed');
    expect(store.isLoading()).toBe(false);
    expect(store.categories()).toEqual([]);
  });
});
