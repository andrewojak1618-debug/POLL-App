import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SUPABASE_CLIENT } from './supabase_client';
import { SurveyRepository } from './survey_repository';

const category = {
  id: '1edb9ae9-e380-45c7-9c79-76e503fbb245',
  name: 'Team Activities',
  slug: 'team_activities',
};

describe('SurveyRepository categories', (): void => {
  const select = vi.fn();
  const from = vi.fn((): { select: typeof select } => ({ select }));
  let repository: SurveyRepository;

  beforeEach((): void => {
    select.mockReset();
    from.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: SUPABASE_CLIENT, useValue: { from } }],
    });
    repository = TestBed.inject(SurveyRepository);
  });

  it('loads category models using the shared client', async (): Promise<void> => {
    select.mockResolvedValue({ data: [{ ...category, ignored: 'extra' }], error: null });
    expect(await repository.loadCategories()).toEqual({ success: true, data: [category] });
    expect(from).toHaveBeenCalledWith('survey_categories');
    expect(select).toHaveBeenCalledWith('id, name, slug');
  });

  it('distinguishes an empty list from a failure', async (): Promise<void> => {
    select.mockResolvedValue({ data: [], error: null });
    expect(await repository.loadCategories()).toEqual({ success: true, data: [] });
  });

  it('reports database errors without exposing internal details', async (): Promise<void> => {
    select.mockResolvedValue({ data: null, error: { message: 'internal detail' } });
    expect(await repository.loadCategories()).toEqual({ success: false, error: 'request_failed' });
  });

  it('handles network rejection and permits a successful retry', async (): Promise<void> => {
    select.mockRejectedValueOnce(new Error('offline'));
    expect(await repository.loadCategories()).toEqual({ success: false, error: 'request_failed' });
    select.mockResolvedValueOnce({ data: [category], error: null });
    expect(await repository.loadCategories()).toEqual({ success: true, data: [category] });
  });

  it.each([null, {}, [category, { ...category, id: 'invalid' }], [{ ...category, name: ' ' }]])(
    'rejects malformed responses without partial results: %j', async (data: unknown): Promise<void> => {
      select.mockResolvedValue({ data, error: null });
      expect(await repository.loadCategories()).toEqual({ success: false, error: 'invalid_data' });
    },
  );
});
