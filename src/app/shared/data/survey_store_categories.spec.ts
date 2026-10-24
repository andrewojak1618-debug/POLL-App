import { EMPTY } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SurveyRealtime } from './survey_realtime';
import { SurveyRepository } from './survey_repository';
import { SurveyStore } from './survey_store';

const ACTIVE_CATEGORY: string = '00000000-0000-4000-8000-000000000001';
const PAST_CATEGORY: string = '00000000-0000-4000-8000-000000000002';

describe('SurveyStore category selections', (): void => {
  let store: SurveyStore;

  beforeEach((): void => {
    TestBed.configureTestingModule({ providers: [{ provide: SurveyRealtime, useValue: { inserts: EMPTY, voteUpdates: EMPTY, start: (): void => {} } }, { provide: SurveyRepository, useValue: {
      loadSurveys: vi.fn().mockResolvedValue({ success: true, data: [] }),
      loadCategories: vi.fn().mockResolvedValue({ success: true, data: [] }),
    } }] });
    store = TestBed.inject(SurveyStore);
  });

  it('starts with all categories selected for both lists', (): void => {
    expect(store.activeCategoryId()).toBeNull();
    expect(store.pastCategoryId()).toBeNull();
  });

  it('changes and resets each selection independently', (): void => {
    store.selectActiveCategory(ACTIVE_CATEGORY);
    expect(store.pastCategoryId()).toBeNull();
    store.selectPastCategory(PAST_CATEGORY);
    expect(store.activeCategoryId()).toBe(ACTIVE_CATEGORY);
    store.selectActiveCategory(null);
    expect(store.activeCategoryId()).toBeNull();
    expect(store.pastCategoryId()).toBe(PAST_CATEGORY);
    store.selectActiveCategory(ACTIVE_CATEGORY);
    store.selectPastCategory(null);
    expect(store.activeCategoryId()).toBe(ACTIVE_CATEGORY);
    expect(store.pastCategoryId()).toBeNull();
  });

  it('retains both selections across loading and access by another consumer', async (): Promise<void> => {
    store.selectActiveCategory(ACTIVE_CATEGORY);
    store.selectPastCategory(PAST_CATEGORY);
    await store.load();
    const shared: SurveyStore = TestBed.inject(SurveyStore);
    expect(shared).toBe(store);
    expect(shared.activeCategoryId()).toBe(ACTIVE_CATEGORY);
    expect(shared.pastCategoryId()).toBe(PAST_CATEGORY);
  });
});
