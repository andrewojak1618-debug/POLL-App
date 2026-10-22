import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SUPABASE_CLIENT } from './supabase_client';
import { SurveyRepository } from './survey_repository';

const category = { id: '00000000-0000-0000-0000-000000000001', name: 'Team', slug: 'team' };
const surveyId = '00000000-0000-0000-0000-000000000002';
const questions = [1, 0].map((position: number) => {
  const id: string = `00000000-0000-0000-0000-00000000000${position + 3}`;
  return { id, survey_id: surveyId, text: 'Choose an activity', position, allows_multiple_answers: position === 1,
    options: [1, 0].map((index: number) => ({
      id: `00000000-0000-0000-0000-00000000000${5 + position * 2 + index}`,
      question_id: id, text: 'Activity', position: index, vote_count: index * 5,
    })),
  };
});
const survey = { id: surveyId, category_id: category.id, title: 'Team event', description: null,
  deadline: null, created_at: '2026-10-14T10:00:00+02:00', category, questions };

describe('SurveyRepository surveys', () => {
  const select = vi.fn();
  const from = vi.fn(() => ({ select }));
  let repository: SurveyRepository;

  beforeEach(() => {
    select.mockReset();
    from.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: SUPABASE_CLIENT, useValue: { from } }] });
    repository = TestBed.inject(SurveyRepository);
  });

  it('loads complete models and independently orders questions and options', async () => {
    select.mockResolvedValue({ data: [survey], error: null });
    const result = await repository.loadSurveys();
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');
    expect(result.data[0].category).toEqual(category);
    expect(result.data[0].questions.map((question) => question.position)).toEqual([0, 1]);
    expect(result.data[0].questions[1].options.map((option) => option.voteCount)).toEqual([0, 5]);
    expect(result.data[0].createdAt).toBe(Date.parse(survey.created_at));
    expect(result.data[0].endsAt).toBeNull();
    expect(questions[0].position).toBe(1);
    expect(from).toHaveBeenCalledWith('surveys');
  });

  it('returns an empty successful list', async () => {
    select.mockResolvedValue({ data: [], error: null });
    expect(await repository.loadSurveys()).toEqual({ success: true, data: [] });
  });

  it('handles database and network failures', async () => {
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
  ])('rejects malformed or incomplete relationships: %j', async (data: unknown) => {
    select.mockResolvedValue({ data, error: null });
    expect(await repository.loadSurveys()).toEqual({ success: false, error: 'invalid_data' });
  });
});

describe('SurveyRepository single survey', () => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  let repository: SurveyRepository;

  beforeEach(() => {
    maybeSingle.mockReset();
    eq.mockClear();
    from.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: SUPABASE_CLIENT, useValue: { from } }] });
    repository = TestBed.inject(SurveyRepository);
  });

  it('filters by ID and maps the complete survey', async () => {
    maybeSingle.mockResolvedValue({ data: survey, error: null });
    const result = await repository.loadSurveyById(surveyId);
    expect(eq).toHaveBeenCalledWith('id', surveyId);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');
    expect(result.data?.id).toBe(surveyId);
    expect(result.data?.category).toEqual(category);
    expect(result.data?.questions.map((question) => question.position)).toEqual([0, 1]);
    expect(result.data?.questions[0].options.map((option) => option.voteCount)).toEqual([0, 5]);
  });

  it('represents a missing record as a successful null result', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await repository.loadSurveyById(surveyId)).toEqual({ success: true, data: null });
  });

  it.each(['', 'not-a-uuid', '123'])('rejects invalid ID %j without querying', async (id: string) => {
    expect(await repository.loadSurveyById(id)).toEqual({ success: false, error: 'invalid_id' });
    expect(from).not.toHaveBeenCalled();
  });

  it('does not treat database or network failures as missing records', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'internal' } });
    expect(await repository.loadSurveyById(surveyId)).toEqual({ success: false, error: 'request_failed' });
    maybeSingle.mockRejectedValueOnce(new Error('offline'));
    expect(await repository.loadSurveyById(surveyId)).toEqual({ success: false, error: 'request_failed' });
    maybeSingle.mockResolvedValueOnce({ data: survey, error: null });
    expect((await repository.loadSurveyById(surveyId)).success).toBe(true);
  });

  it.each([undefined, { ...survey, category: null }, { ...survey, questions: [] }])(
    'rejects invalid response %j', async (data: unknown) => {
      maybeSingle.mockResolvedValue({ data, error: null });
      expect(await repository.loadSurveyById(surveyId)).toEqual({ success: false, error: 'invalid_data' });
    },
  );

  it('rejects a valid survey returned for a different requested ID', async () => {
    maybeSingle.mockResolvedValue({ data: survey, error: null });
    expect(await repository.loadSurveyById(category.id)).toEqual({ success: false, error: 'invalid_data' });
  });
});
