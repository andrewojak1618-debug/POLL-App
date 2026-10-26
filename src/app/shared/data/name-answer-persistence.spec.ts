import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import type { CreateSurveyData } from '../models/create_survey_data';
import { SUPABASE_CLIENT } from './supabase_client';
import { SurveyRepository } from './survey_repository';

it.each(['name', 'answer'])('rejects oversized %s before any database call', async (field: string): Promise<void> => {
  const rpc = vi.fn();
  TestBed.configureTestingModule({ providers: [{ provide: SUPABASE_CLIENT, useValue: { rpc } }] });
  const survey: CreateSurveyData = {
    title: field === 'name' ? 'N'.repeat(101) : 'Valid name',
    categoryId: '00000000-0000-4000-8000-000000000002', description: null, endsAt: null,
    questions: [{ text: 'Question', allowsMultipleAnswers: false, options: [{ text: field === 'answer' ? 'A'.repeat(201) : 'Yes' }, { text: 'No' }] }],
  };
  expect(await TestBed.inject(SurveyRepository).createSurvey(survey)).toEqual({ success: false, error: 'invalid_input' });
  expect(rpc).not.toHaveBeenCalled();
});
