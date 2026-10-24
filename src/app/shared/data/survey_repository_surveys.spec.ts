import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { SurveyQuestionDetail } from '../models/survey_detail';
import type { SurveyOption } from '../models/survey_option';
import { SUPABASE_CLIENT } from './supabase_client';
import { SurveyRepository } from './survey_repository';

const category = { id: '00000000-0000-0000-0000-000000000001', name: 'Team', slug: 'team' };
const SURVEY_ID = '00000000-0000-0000-0000-000000000002';
const questions = [1, 0].map((position: number): { id: string; survey_id: string; text: string; position: number; allows_multiple_answers: boolean; options: { id: string; question_id: string; text: string; position: number; vote_count: number; }[]; } => {
  const id: string = `00000000-0000-0000-0000-00000000000${position + 3}`;
  return { id, survey_id: SURVEY_ID, text: 'Choose an activity', position, allows_multiple_answers: position === 1,
    options: [1, 0].map((index: number): { id: string; question_id: string; text: string; position: number; vote_count: number; } => ({
      id: `00000000-0000-0000-0000-00000000000${5 + position * 2 + index}`,
      question_id: id, text: 'Activity', position: index, vote_count: index * 5,
    })),
  };
});
const survey = { id: SURVEY_ID, category_id: category.id, title: 'Team event', description: null,
  deadline: null, created_at: '2026-10-14T10:00:00+02:00', category, questions };

describe('SurveyRepository surveys', (): void => {
  const select = vi.fn();
  const from = vi.fn((): { select: typeof select } => ({ select }));
  let repository: SurveyRepository;

  beforeEach((): void => {
    select.mockReset();
    from.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: SUPABASE_CLIENT, useValue: { from } }] });
    repository = TestBed.inject(SurveyRepository);
  });

  it('loads complete models and independently orders questions and options', async (): Promise<void> => {
    select.mockResolvedValue({ data: [survey], error: null });
    const result = await repository.loadSurveys();
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');
    expect(result.data[0].category).toEqual(category);
    expect(result.data[0].questions.map((question: SurveyQuestionDetail): number => question.position)).toEqual([0, 1]);
    expect(result.data[0].questions[1].options.map((option: SurveyOption): number => option.voteCount)).toEqual([0, 5]);
    expect(result.data[0].createdAt).toBe(Date.parse(survey.created_at));
    expect(result.data[0].endsAt).toBeNull();
    expect(questions[0].position).toBe(1);
    expect(from).toHaveBeenCalledWith('surveys');
  });

  it('returns an empty successful list', async (): Promise<void> => {
    select.mockResolvedValue({ data: [], error: null });
    expect(await repository.loadSurveys()).toEqual({ success: true, data: [] });
  });

  it('handles database and network failures', async (): Promise<void> => {
    select.mockResolvedValueOnce({ data: null, error: { message: 'internal' } });
    expect(await repository.loadSurveys()).toEqual({ success: false, error: 'request_failed' });
    select.mockRejectedValueOnce(new Error('offline'));
    expect(await repository.loadSurveys()).toEqual({ success: false, error: 'request_failed' });
  });

  it.each([
    null, [survey, { ...survey, category: null }], [{ ...survey, questions: [] }],
    [{ ...survey, questions: [{ ...questions[0], options: [] }] }],
    [{ ...survey, questions: [{ ...questions[0], options: questions[1].options }] }],
    [{ ...survey, deadline: 'invalid' }],
  ])('rejects malformed or incomplete relationships: %j', async (data: unknown): Promise<void> => {
    select.mockResolvedValue({ data, error: null });
    expect(await repository.loadSurveys()).toEqual({ success: false, error: 'invalid_data' });
  });
});

describe('SurveyRepository single survey', (): void => {
  const maybeSingle = vi.fn();
  const eq = vi.fn((): { maybeSingle: typeof maybeSingle } => ({ maybeSingle }));
  const select = vi.fn((): { eq: typeof eq } => ({ eq }));
  const from = vi.fn((): { select: typeof select } => ({ select }));
  let repository: SurveyRepository;

  beforeEach((): void => {
    maybeSingle.mockReset();
    eq.mockClear();
    from.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: SUPABASE_CLIENT, useValue: { from } }] });
    repository = TestBed.inject(SurveyRepository);
  });

  it('filters by ID and maps the complete survey', async (): Promise<void> => {
    maybeSingle.mockResolvedValue({ data: survey, error: null });
    const result = await repository.loadSurveyById(SURVEY_ID);
    expect(eq).toHaveBeenCalledWith('id', SURVEY_ID);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');
    expect(result.data?.id).toBe(SURVEY_ID);
    expect(result.data?.category).toEqual(category);
    expect(result.data?.questions.map((question: SurveyQuestionDetail): number => question.position)).toEqual([0, 1]);
    expect(result.data?.questions[0].options.map((option: SurveyOption): number => option.voteCount)).toEqual([0, 5]);
  });

  it('represents a missing record as a successful null result', async (): Promise<void> => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await repository.loadSurveyById(SURVEY_ID)).toEqual({ success: true, data: null });
  });

  it.each(['', 'not-a-uuid', '123'])('rejects invalid ID %j without querying', async (id: string): Promise<void> => {
    expect(await repository.loadSurveyById(id)).toEqual({ success: false, error: 'invalid_id' });
    expect(from).not.toHaveBeenCalled();
  });

  it('does not treat database or network failures as missing records', async (): Promise<void> => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'internal' } });
    expect(await repository.loadSurveyById(SURVEY_ID)).toEqual({ success: false, error: 'request_failed' });
    maybeSingle.mockRejectedValueOnce(new Error('offline'));
    expect(await repository.loadSurveyById(SURVEY_ID)).toEqual({ success: false, error: 'request_failed' });
    maybeSingle.mockResolvedValueOnce({ data: survey, error: null });
    expect((await repository.loadSurveyById(SURVEY_ID)).success).toBe(true);
  });

  it.each([undefined, { ...survey, category: null }, { ...survey, questions: [] }])(
    'rejects invalid response %j', async (data: unknown): Promise<void> => {
      maybeSingle.mockResolvedValue({ data, error: null });
      expect(await repository.loadSurveyById(SURVEY_ID)).toEqual({ success: false, error: 'invalid_data' });
    },
  );

  it('rejects a valid survey returned for a different requested ID', async (): Promise<void> => {
    maybeSingle.mockResolvedValue({ data: survey, error: null });
    expect(await repository.loadSurveyById(category.id)).toEqual({ success: false, error: 'invalid_data' });
  });
});
