import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import type { CreateSurveyData } from '../models/create_survey_data';
import { SUPABASE_CLIENT } from './supabase_client';
import { SurveyRepository } from './survey_repository';

const surveyId: string = '00000000-0000-4000-8000-000000000001';
const survey: CreateSurveyData = {
  categoryId: '00000000-0000-4000-8000-000000000002', title: 'Team afternoon',
  description: 'Choose our activities', endsAt: Date.parse('2026-11-01T18:00:00+01:00'),
  questions: [
    { text: 'Where?', allowsMultipleAnswers: false, options: [{ text: 'Park' }, { text: 'Office' }] },
    { text: 'Activities?', allowsMultipleAnswers: true, options: [{ text: 'Games' }, { text: 'Cooking' }] },
  ],
};

describe('SurveyRepository creation', () => {
  const rpc = vi.fn();
  const from = vi.fn();
  let repository: SurveyRepository;

  beforeEach(() => {
    rpc.mockReset();
    from.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: SUPABASE_CLIENT, useValue: { rpc, from } }] });
    repository = TestBed.inject(SurveyRepository);
  });

  it('sends the complete model and UTC deadline through the RPC only', async () => {
    rpc.mockResolvedValue({ data: surveyId, error: null });
    expect(await repository.createSurvey(survey)).toEqual({ success: true, data: surveyId });
    expect(rpc).toHaveBeenCalledExactlyOnceWith('create_survey_with_questions', {
      p_category_id: survey.categoryId, p_title: survey.title,
      p_description: survey.description, p_deadline: '2026-11-01T17:00:00.000Z',
      p_questions: survey.questions,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it('preserves optional null values', async () => {
    rpc.mockResolvedValue({ data: surveyId, error: null });
    await repository.createSurvey({ ...survey, endsAt: null, description: null });
    expect(rpc).toHaveBeenCalledWith('create_survey_with_questions', expect.objectContaining({
      p_deadline: null, p_description: null,
    }));
  });

  it.each([NaN, Infinity, 0.5])('rejects an unserializable deadline %s before writing', async (endsAt: number) => {
    expect(await repository.createSurvey({ ...survey, endsAt })).toEqual({ success: false, error: 'invalid_input' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('forwards RPC rejection as a typed error', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'internal detail' } });
    expect(await repository.createSurvey(survey)).toEqual({ success: false, error: 'request_failed' });
  });

  it('does not automatically retry a failed write', async () => {
    rpc.mockRejectedValue(new Error('connection lost'));
    expect(await repository.createSurvey(survey)).toEqual({ success: false, error: 'request_failed' });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it.each([null, '', 'invalid', { id: surveyId }])('rejects an invalid returned ID %j', async (data: unknown) => {
    rpc.mockResolvedValue({ data, error: null });
    expect(await repository.createSurvey(survey)).toEqual({ success: false, error: 'invalid_data' });
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
