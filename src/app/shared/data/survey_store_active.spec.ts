import { EMPTY } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SurveyRealtime } from './survey_realtime';
import { SurveyRepository } from './survey_repository';
import { SurveyStore } from './survey_store';
import type { SurveyDetail } from '../models/survey_detail';

const NOW: number = Date.parse('2026-10-21T12:00:00Z');

/**
 * Builds a survey model for testing deadline-based state.
 * @param id - Identifier of the test survey.
 * @param endsAt - Deadline in Unix milliseconds, or null for an unlimited survey.
 * @returns A survey fixture with the requested identity, category and deadline.
 */
function survey(id: string, endsAt: number | null): SurveyDetail {
  return { id, endsAt, categoryId: 'category', title: 'Team activities', description: null,
    createdAt: NOW - 10000, category: { id: 'category', name: 'Team', slug: 'team' }, questions: [] };
}

describe('SurveyStore survey status', (): void => {
  const loadSurveys = vi.fn();
  let store: SurveyStore;

  beforeEach((): void => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    loadSurveys.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: SurveyRealtime, useValue: { inserts: EMPTY, voteUpdates: EMPTY, start: (): void => {} } }, { provide: SurveyRepository, useValue: {
      loadSurveys, loadCategories: vi.fn().mockResolvedValue({ success: true, data: [] }),
    } }] });
    store = TestBed.inject(SurveyStore);
  });

  afterEach((): void => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('keeps future and absent deadlines and excludes reached deadlines', async (): Promise<void> => {
    const rows: readonly SurveyDetail[] = [survey('future', NOW + 1000), survey('past', NOW - 1),
      survey('equal', NOW), survey('open', null)];
    loadSurveys.mockResolvedValue({ success: true, data: rows });
    expect(store.activeSurveys()).toEqual([]);
    expect(store.pastSurveys()).toEqual([]);
    await store.load();
    expect(store.activeSurveys().map((item: SurveyDetail): string => item.id)).toEqual(['future', 'open']);
    expect(store.surveys()).toEqual(rows);
    vi.advanceTimersByTime(1000);
    expect(store.activeSurveys().map((item: SurveyDetail): string => item.id)).toEqual(['open']);
    expect(store.surveys()).toEqual(rows);
    expect(store.pastSurveys().map((item: SurveyDetail): string => item.id)).toEqual(['future', 'past', 'equal']);
    expect(store.pastSurveys().some((item: SurveyDetail): boolean => store.activeSurveys().includes(item))).toBe(false);
    expect(loadSurveys).toHaveBeenCalledTimes(1);
  });

  it('recomputes after loading replacement data including an empty list', async (): Promise<void> => {
    loadSurveys.mockResolvedValueOnce({ success: true, data: [survey('first', null)] });
    await store.load();
    expect(store.activeSurveys()).toHaveLength(1);
    loadSurveys.mockResolvedValueOnce({ success: true, data: [survey('second', NOW + 5000)] });
    await store.load();
    expect(store.activeSurveys()[0].id).toBe('second');
    loadSurveys.mockResolvedValueOnce({ success: true, data: [] });
    await store.load();
    expect(store.activeSurveys()).toEqual([]);
    expect(store.pastSurveys()).toEqual([]);
  });

  it('replaces past results on reload without retaining removed surveys', async (): Promise<void> => {
    loadSurveys.mockResolvedValueOnce({ success: true, data: [survey('old', NOW - 1000)] });
    await store.load();
    expect(store.pastSurveys()[0].id).toBe('old');
    loadSurveys.mockResolvedValueOnce({ success: true, data: [survey('replacement', NOW)] });
    await store.load();
    expect(store.pastSurveys().map((item: SurveyDetail): string => item.id)).toEqual(['replacement']);
    expect(store.activeSurveys()).toEqual([]);
    loadSurveys.mockResolvedValueOnce({ success: true, data: [] });
    await store.load();
    expect(store.pastSurveys()).toEqual([]);
  });

  it('derives the next upcoming deadlines without changing the source list', async (): Promise<void> => {
    const day: number = 24 * 60 * 60 * 1000;
    const rows: readonly SurveyDetail[] = [survey('boundary', NOW + day), survey('open', null),
      survey('expired', NOW), survey('soon', NOW + 1000), survey('outside', NOW + day + 1000)];
    loadSurveys.mockResolvedValue({ success: true, data: rows });
    expect(store.endingSoonSurveys()).toEqual([]);
    await store.load();
    expect(store.endingSoonSurveys().map((item: SurveyDetail): string => item.id)).toEqual(['soon', 'boundary', 'outside']);
    expect(store.surveys()).toEqual(rows);
    vi.advanceTimersByTime(1000);
    expect(store.endingSoonSurveys().map((item: SurveyDetail): string => item.id)).toEqual(['boundary', 'outside']);
    expect(store.surveys()).toEqual(rows);
    expect(loadSurveys).toHaveBeenCalledTimes(1);
  });

  it('refreshes the ending-soon list after reloading data', async (): Promise<void> => {
    loadSurveys.mockResolvedValueOnce({ success: true, data: [survey('soon', NOW + 5000)] });
    await store.load();
    expect(store.endingSoonSurveys()).toHaveLength(1);
    loadSurveys.mockResolvedValueOnce({ success: true, data: [] });
    await store.load();
    expect(store.endingSoonSurveys()).toEqual([]);
  });
});
