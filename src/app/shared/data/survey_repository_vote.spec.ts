import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SUPABASE_CLIENT } from './supabase_client';
import { SurveyRepository } from './survey_repository';

const questionId: string = 'b7100000-0000-4000-8000-000000000009';
const firstOption: string = 'b7200000-0000-4000-8000-000000000025';
const secondOption: string = 'b7200000-0000-4000-8000-000000000026';

describe('SurveyRepository voting', () => {
  const rpc = vi.fn();
  const from = vi.fn();
  let repository: SurveyRepository;

  beforeEach(() => {
    rpc.mockReset();
    from.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: SUPABASE_CLIENT, useValue: { rpc, from } }] });
    repository = TestBed.inject(SurveyRepository);
  });

  it.each([[firstOption], [firstOption, secondOption]])(
    'submits selected options through the RPC: %j', async (...selected: string[]) => {
      const optionIds: readonly string[] = Object.freeze(selected);
      rpc.mockResolvedValue({ data: null, error: null });
      expect(await repository.voteForQuestion(questionId, optionIds)).toEqual({ success: true, data: undefined });
      expect(rpc).toHaveBeenCalledExactlyOnceWith('vote_for_question', {
        p_question_id: questionId, p_option_ids: selected,
      });
      expect(from).not.toHaveBeenCalled();
      expect(optionIds).toEqual(selected);
    },
  );

  it.each(['expired', 'foreign option', 'invalid selection'])('returns a typed RPC error: %s', async (message: string) => {
    rpc.mockResolvedValue({ data: null, error: { code: '22023', message } });
    expect(await repository.voteForQuestion(questionId, [firstOption])).toEqual({ success: false, error: 'request_failed' });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('passes empty selections to server validation without silently changing them', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '22023' } });
    expect(await repository.voteForQuestion(questionId, [])).toEqual({ success: false, error: 'request_failed' });
    expect(rpc).toHaveBeenCalledWith('vote_for_question', { p_question_id: questionId, p_option_ids: [] });
  });

  it('does not automatically repeat a vote after a network failure', async () => {
    rpc.mockRejectedValue(new Error('connection lost'));
    expect(await repository.voteForQuestion(questionId, [firstOption])).toEqual({ success: false, error: 'request_failed' });
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
