import { EMPTY } from 'rxjs';
import { SurveyRealtime } from './survey_realtime';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SurveyRepository } from './survey_repository';
import { SurveyStore } from './survey_store';
import type { RepositoryResult } from './repository_result';
import type { SurveyDetail } from '../models/survey_detail';

const SURVEY: SurveyDetail = { id: 'survey', categoryId: 'category', title: 'Team', description: null,
  endsAt: null, createdAt: 0, category: { id: 'category', name: 'Team', slug: 'team' }, questions: [{
    id: 'question', surveyId: 'survey', text: 'Activity?', position: 0, allowsMultipleAnswers: true,
    options: [{ id: 'option', questionId: 'question', text: 'Walk', position: 0, voteCount: 1 }],
  }] };

describe('SurveyStore voting', () => {
  const voteForQuestion = vi.fn();
  const loadSurveys = vi.fn();
  let store: SurveyStore;

  beforeEach(() => {
    voteForQuestion.mockReset().mockResolvedValue({ success: true, data: undefined });
    loadSurveys.mockReset().mockResolvedValue({ success: true, data: [SURVEY] });
    TestBed.configureTestingModule({ providers: [{ provide: SurveyRealtime, useValue: { inserts: EMPTY, voteUpdates: EMPTY, start: (): void => {} } }, { provide: SurveyRepository, useValue: {
      voteForQuestion, loadSurveys, loadCategories: vi.fn().mockResolvedValue({ success: true, data: [SURVEY.category] }),
    } }] });
    store = TestBed.inject(SurveyStore);
  });

  it('refreshes vote counts and retains category selections', async () => {
    store.selectActiveCategory('category');
    store.selectPastCategory('other');
    const pending = store.voteForQuestion('question', ['option']);
    expect(store.isVoting()).toBe(true);
    expect(await pending).toEqual({ success: true, data: undefined });
    expect(voteForQuestion).toHaveBeenCalledExactlyOnceWith('question', ['option']);
    expect(store.surveys()[0].questions[0].options[0].voteCount).toBe(1);
    expect(store.activeCategoryId()).toBe('category');
    expect(store.pastCategoryId()).toBe('other');
    expect(store.isVoting()).toBe(false);
  });

  it('shares concurrent calls without sending duplicate votes', async () => {
    let finish!: (value: RepositoryResult<void>) => void;
    voteForQuestion.mockReturnValue(new Promise<RepositoryResult<void>>((resolve) => { finish = resolve; }));
    const first = store.voteForQuestion('question', ['option']);
    expect(store.voteForQuestion('question', ['option'])).toBe(first);
    expect(voteForQuestion).toHaveBeenCalledTimes(1);
    finish({ success: true, data: undefined });
    await first;
    expect(store.isVoting()).toBe(false);
  });

  it('preserves data after rejection and clears the error for a later submission', async () => {
    await store.load();
    voteForQuestion.mockResolvedValueOnce({ success: false, error: 'request_failed' });
    expect(await store.voteForQuestion('question', [])).toEqual({ success: false, error: 'request_failed' });
    expect(store.error()).toBe('request_failed');
    expect(store.surveys()).toEqual([SURVEY]);
    expect(loadSurveys).toHaveBeenCalledTimes(1);
    await store.voteForQuestion('question', ['option']);
    expect(store.error()).toBeNull();
  });

  it('keeps vote success when refreshing fails', async () => {
    loadSurveys.mockResolvedValue({ success: false, error: 'request_failed' });
    expect(await store.voteForQuestion('question', ['option'])).toEqual({ success: true, data: undefined });
    expect(store.error()).toBe('request_failed');
    expect(voteForQuestion).toHaveBeenCalledTimes(1);
    expect(store.isVoting()).toBe(false);
  });

  it('handles unexpected rejection without retrying', async () => {
    voteForQuestion.mockRejectedValue(new Error('offline'));
    expect(await store.voteForQuestion('question', ['option'])).toEqual({ success: false, error: 'request_failed' });
    expect(store.isVoting()).toBe(false);
    expect(loadSurveys).not.toHaveBeenCalled();
    expect(voteForQuestion).toHaveBeenCalledTimes(1);
  });

  it('waits for an older load before refreshing vote counts', async () => {
    let finish!: (value: RepositoryResult<readonly SurveyDetail[]>) => void;
    loadSurveys.mockReturnValueOnce(new Promise<RepositoryResult<readonly SurveyDetail[]>>((resolve) => { finish = resolve; }));
    const older = store.load();
    const voting = store.voteForQuestion('question', ['option']);
    await Promise.resolve();
    expect(loadSurveys).toHaveBeenCalledTimes(1);
    finish({ success: true, data: [] });
    await older;
    await voting;
    expect(loadSurveys).toHaveBeenCalledTimes(2);
    expect(store.surveys()).toEqual([SURVEY]);
  });
});