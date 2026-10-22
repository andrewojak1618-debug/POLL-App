import type { SurveyOption } from '../models/survey_option';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { SurveyRealtime } from './survey_realtime';
import { SurveyRepository } from './survey_repository';
import { SurveyStore } from './survey_store';
import type { SurveyInsertTable } from './survey_realtime';
import type { SurveyDetail } from '../models/survey_detail';
import type { RepositoryResult } from './repository_result';

const ROW: SurveyDetail = { id: 'survey', title: 'Team', description: null, categoryId: 'team',
  createdAt: 0, endsAt: null, category: { id: 'team', name: 'Team', slug: 'team' }, questions: [] };

describe('SurveyStore realtime refresh', () => {
  let inserts: Subject<SurveyInsertTable>;
  let votes: Subject<SurveyOption | null>;
  let store: SurveyStore;
  const loadSurveys = vi.fn();
  const start = vi.fn();
  const voteForQuestion = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    inserts = new Subject<SurveyInsertTable>();
    votes = new Subject<SurveyOption | null>();
    start.mockClear();
    voteForQuestion.mockReset().mockResolvedValue({ success: true, data: undefined });
    loadSurveys.mockReset().mockResolvedValue({ success: true, data: [] });
    TestBed.configureTestingModule({ providers: [
      { provide: SurveyRealtime, useValue: { inserts, voteUpdates: votes, start } },
      { provide: SurveyRepository, useValue: { loadSurveys, voteForQuestion,
        loadCategories: vi.fn().mockResolvedValue({ success: true, data: [ROW.category] }) } },
    ] });
    store = TestBed.inject(SurveyStore);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('bundles inserts and vote updates, reloads data and preserves filters', async () => {
    await store.load();
    expect(start).toHaveBeenCalled();
    store.selectActiveCategory('team');
    store.selectPastCategory('other');
    loadSurveys.mockResolvedValue({ success: true, data: [ROW] });
    inserts.next('surveys');
    inserts.next('survey_questions');
    inserts.next('survey_options');
    votes.next(null);
    await vi.advanceTimersByTimeAsync(50);
    expect(loadSurveys).toHaveBeenCalledTimes(2);
    expect(store.filteredActiveSurveys()).toEqual([ROW]);
    expect(store.pastCategoryId()).toBe('other');
  });

  it('performs a follow-up read for an event arriving during a load', async () => {
    let finish!: (result: RepositoryResult<readonly SurveyDetail[]>) => void;
    loadSurveys.mockReturnValueOnce(new Promise<RepositoryResult<readonly SurveyDetail[]>>((resolve) => { finish = resolve; }));
    const pending = store.load();
    votes.next(null);
    await vi.advanceTimersByTimeAsync(50);
    expect(loadSurveys).toHaveBeenCalledTimes(1);
    loadSurveys.mockResolvedValue({ success: true, data: [ROW] });
    finish({ success: true, data: [] });
    await pending;
    expect(loadSurveys).toHaveBeenCalledTimes(2);
    expect(store.surveys()).toEqual([ROW]);
  });

  it('preserves data on refresh failure and recovers on the next event', async () => {
    loadSurveys.mockResolvedValueOnce({ success: true, data: [ROW] });
    await store.load();
    loadSurveys.mockResolvedValueOnce({ success: false, error: 'request_failed' });
    votes.next(null);
    await vi.advanceTimersByTimeAsync(50);
    expect(store.error()).toBe('request_failed');
    expect(store.surveys()).toEqual([ROW]);
    votes.next(null);
    await vi.advanceTimersByTimeAsync(50);
    expect(store.error()).toBeNull();
    expect(store.surveys()).toEqual([]);
  });

  it('cancels buffered notifications on destruction', async () => {
    await store.load();
    votes.next(null);
    TestBed.resetTestingModule();
    inserts.next('surveys');
    await vi.advanceTimersByTimeAsync(100);
    expect(loadSurveys).toHaveBeenCalledTimes(1);
  });

  it('absorbs own events before and after refresh but still reloads another vote', async () => {
    const option: SurveyOption = { id: 'option', questionId: 'question', text: 'Walk', position: 0, voteCount: 1 };
    const updated: SurveyDetail = { ...ROW, questions: [{ id: 'question', surveyId: ROW.id,
      text: 'Activity?', position: 0, allowsMultipleAnswers: false, options: [option] }] };
    await store.load();
    let finish!: (result: RepositoryResult<void>) => void;
    voteForQuestion.mockReturnValue(new Promise<RepositoryResult<void>>((resolve) => { finish = resolve; }));
    const pending = store.voteForQuestion('question', ['option']);
    votes.next(option);
    await vi.advanceTimersByTimeAsync(50);
    expect(loadSurveys).toHaveBeenCalledTimes(1);
    loadSurveys.mockResolvedValue({ success: true, data: [updated] });
    finish({ success: true, data: undefined });
    await pending;
    expect(loadSurveys).toHaveBeenCalledTimes(2);
    votes.next(option);
    await vi.advanceTimersByTimeAsync(50);
    expect(loadSurveys).toHaveBeenCalledTimes(2);
    expect(store.surveys()[0].questions[0].options[0].voteCount).toBe(1);
    votes.next({ ...option, voteCount: 2 });
    await vi.advanceTimersByTimeAsync(50);
    expect(loadSurveys).toHaveBeenCalledTimes(3);
    expect(voteForQuestion).toHaveBeenCalledTimes(1);
  });

  it('retains external events when the own vote is rejected', async () => {
    await store.load();
    let finish!: (result: RepositoryResult<void>) => void;
    voteForQuestion.mockReturnValue(new Promise<RepositoryResult<void>>((resolve) => { finish = resolve; }));
    const pending = store.voteForQuestion('question', []);
    votes.next(null);
    await vi.advanceTimersByTimeAsync(50);
    finish({ success: false, error: 'request_failed' });
    expect((await pending).success).toBe(false);
    await vi.advanceTimersByTimeAsync(50);
    expect(loadSurveys).toHaveBeenCalledTimes(2);
  });
});
