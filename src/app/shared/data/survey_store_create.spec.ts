import { EMPTY } from 'rxjs';
import { SurveyRealtime } from './survey_realtime';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SurveyRepository } from './survey_repository';
import { SurveyStore } from './survey_store';
import type { CreateSurveyData } from '../models/create_survey_data';
import type { SurveyDetail } from '../models/survey_detail';
import type { RepositoryResult } from './repository_result';

const INPUT: CreateSurveyData = { categoryId: 'category', title: 'Team', description: null, endsAt: null,
  questions: [{ text: 'Activity?', allowsMultipleAnswers: false, options: [{ text: 'Walk' }, { text: 'Read' }] }] };
const SAVED: SurveyDetail = { id: 'created', categoryId: 'category', title: 'Team', description: null,
  endsAt: null, createdAt: 0, category: { id: 'category', name: 'Team', slug: 'team' }, questions: [] };

describe('SurveyStore creation', () => {
  const createSurvey = vi.fn();
  const loadSurveys = vi.fn();
  const loadCategories = vi.fn();
  let store: SurveyStore;

  beforeEach(() => {
    createSurvey.mockReset().mockResolvedValue({ success: true, data: SAVED.id });
    loadSurveys.mockReset().mockResolvedValue({ success: true, data: [SAVED] });
    loadCategories.mockReset().mockResolvedValue({ success: true, data: [SAVED.category] });
    TestBed.configureTestingModule({ providers: [{ provide: SurveyRealtime, useValue: { inserts: EMPTY, voteUpdates: EMPTY, start: (): void => {} } }, { provide: SurveyRepository,
      useValue: { createSurvey, loadSurveys, loadCategories } }] });
    store = TestBed.inject(SurveyStore);
  });

  it('refreshes after creation and retains filter selections', async () => {
    store.selectActiveCategory('category');
    store.selectPastCategory('other');
    const pending = store.createSurvey(INPUT);
    expect(store.isCreating()).toBe(true);
    expect(await pending).toEqual({ success: true, data: SAVED.id });
    expect(createSurvey).toHaveBeenCalledExactlyOnceWith(INPUT);
    expect(store.surveys()).toEqual([SAVED]);
    expect(store.filteredActiveSurveys()).toEqual([SAVED]);
    expect(store.activeCategoryId()).toBe('category');
    expect(store.pastCategoryId()).toBe('other');
    expect(store.isCreating()).toBe(false);
  });

  it('shares a pending creation instead of sending a second write', async () => {
    let finish!: (value: RepositoryResult<string>) => void;
    createSurvey.mockReturnValue(new Promise<RepositoryResult<string>>((resolve) => { finish = resolve; }));
    const first = store.createSurvey(INPUT);
    expect(store.createSurvey(INPUT)).toBe(first);
    expect(createSurvey).toHaveBeenCalledTimes(1);
    finish({ success: true, data: SAVED.id });
    await first;
    expect(store.isCreating()).toBe(false);
  });

  it('keeps existing data on a rejected creation and permits a later attempt', async () => {
    await store.load();
    createSurvey.mockResolvedValueOnce({ success: false, error: 'invalid_input' });
    expect(await store.createSurvey(INPUT)).toEqual({ success: false, error: 'invalid_input' });
    expect(store.error()).toBe('invalid_input');
    expect(store.surveys()).toEqual([SAVED]);
    expect(loadSurveys).toHaveBeenCalledTimes(1);
    await store.createSurvey(INPUT);
    expect(store.error()).toBeNull();
  });

  it('preserves creation success when refreshing fails', async () => {
    loadSurveys.mockResolvedValue({ success: false, error: 'request_failed' });
    expect(await store.createSurvey(INPUT)).toEqual({ success: true, data: SAVED.id });
    expect(store.error()).toBe('request_failed');
    expect(createSurvey).toHaveBeenCalledTimes(1);
    expect(store.isCreating()).toBe(false);
  });

  it('handles unexpected write rejection without automatic retries', async () => {
    createSurvey.mockRejectedValue(new Error('offline'));
    expect(await store.createSurvey(INPUT)).toEqual({ success: false, error: 'request_failed' });
    expect(store.error()).toBe('request_failed');
    expect(store.isCreating()).toBe(false);
    expect(loadSurveys).not.toHaveBeenCalled();
  });

  it('waits for an older load before refreshing the newly created survey', async () => {
    let finish!: (value: RepositoryResult<readonly SurveyDetail[]>) => void;
    loadSurveys.mockReturnValueOnce(new Promise<RepositoryResult<readonly SurveyDetail[]>>((resolve) => { finish = resolve; }));
    const older = store.load();
    const creation = store.createSurvey(INPUT);
    await Promise.resolve();
    expect(loadSurveys).toHaveBeenCalledTimes(1);
    finish({ success: true, data: [] });
    await older;
    await creation;
    expect(loadSurveys).toHaveBeenCalledTimes(2);
    expect(store.surveys()).toEqual([SAVED]);
  });
});