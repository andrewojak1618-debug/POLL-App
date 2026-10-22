import type { CreateSurveyData } from '../models/create_survey_data';
import { writeTimestamp } from './survey_dates';
import type { SurveyDetail } from '../models/survey_detail';
import { mapNestedSurvey } from './survey_nested_mapper';
import { inject, Injectable } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SurveyCategoryData } from '../models/survey_category_data';
import { readArray, readId, requireData } from './data_checks';
import { mapCategory } from './survey_rows';
import { SUPABASE_CLIENT } from './supabase_client';
import type { RepositoryResult } from './repository_result';

const SURVEY_SELECTION = `
  id, category_id, title, description, deadline, created_at,
  category:survey_categories(id, name, slug),
  questions:survey_questions(id, survey_id, text, position, allows_multiple_answers,
    options:survey_options(id, question_id, text, position, vote_count))
`;
/** Encapsulates database access for surveys, questions and answer options. */
@Injectable({ providedIn: 'root' })
export class SurveyRepository {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);

  /**
   * Loads and validates the available categories.
   * @returns Categories (possibly empty), or a typed request or data error.
   */
  async loadCategories(): Promise<RepositoryResult<readonly SurveyCategoryData[]>> {
    try {
      const { data, error } = await this.supabase.from('survey_categories').select('id, name, slug');
      if (error) return { success: false, error: 'request_failed' };
      return this.mapCategories(data);
    } catch {
      return { success: false, error: 'request_failed' };
    }
  }

  /**
   * Maps untrusted category rows without returning partially valid results.
   * @param data - The database response to validate.
   * @returns Valid categories or an invalid-data result.
   */
  private mapCategories(data: unknown): RepositoryResult<readonly SurveyCategoryData[]> {
    try {
      return { success: true, data: readArray(data).map(mapCategory) };
    } catch {
      return { success: false, error: 'invalid_data' };
    }
  }
  /**
   * Loads surveys with their category, questions and answer options.
   * @returns Complete ordered survey models, an empty list, or a typed error.
   */
  async loadSurveys(): Promise<RepositoryResult<readonly SurveyDetail[]>> {
    try {
      const { data, error } = await this.supabase.from('surveys').select(SURVEY_SELECTION);
      if (error) return { success: false, error: 'request_failed' };
      return this.mapSurveys(data);
    } catch {
      return { success: false, error: 'request_failed' };
    }
  }

  /**
   * Validates the complete response without exposing partial survey data.
   * @param data - Untrusted nested database rows.
   * @returns Valid surveys or an invalid-data result.
   */
  private mapSurveys(data: unknown): RepositoryResult<readonly SurveyDetail[]> {
    try {
      return { success: true, data: readArray(data).map(mapNestedSurvey) };
    } catch {
      return { success: false, error: 'invalid_data' };
    }
  }

  /**
   * Loads one survey by its stable UUID.
   * @param id - The survey identifier to validate before querying.
   * @returns The survey, null when absent, or a typed error.
   */
  async loadSurveyById(id: string): Promise<RepositoryResult<SurveyDetail | null>> {
    let surveyId: string;
    try {
      surveyId = readId(id, 'survey ID');
    } catch {
      return { success: false, error: 'invalid_id' };
    }
    return this.requestSurvey(surveyId);
  }

  /**
   * Queries a single survey without loading the entire survey list.
   * @param id - A validated UUID.
   * @returns The mapped response or a request error.
   */
  private async requestSurvey(id: string): Promise<RepositoryResult<SurveyDetail | null>> {
    try {
      const { data, error } = await this.supabase.from('surveys')
        .select(SURVEY_SELECTION).eq('id', id).maybeSingle();
      if (error) return { success: false, error: 'request_failed' };
      return this.mapSingleSurvey(data, id);
    } catch {
      return { success: false, error: 'request_failed' };
    }
  }

  /**
   * Validates a single response and preserves the absent-record state.
   * @param data - The untrusted database response.
   * @param id - The requested UUID.
   * @returns A matching survey, null, or an invalid-data error.
   */
  private mapSingleSurvey(data: unknown, id: string): RepositoryResult<SurveyDetail | null> {
    if (data === null) return { success: true, data: null };
    try {
      const survey: SurveyDetail = mapNestedSurvey(data);
      requireData(survey.id === id, 'requested survey ID');
      return { success: true, data: survey };
    } catch {
      return { success: false, error: 'invalid_data' };
    }
  }

  /**
   * Creates a complete survey through the validated, atomic database function.
   * @param survey - New survey content with a deadline expressed in milliseconds.
   * @returns The generated survey UUID or a typed error; requests are not retried.
   */
  async createSurvey(survey: CreateSurveyData): Promise<RepositoryResult<string>> {
    let deadline: string | null;
    try {
      deadline = writeTimestamp(survey.endsAt);
    } catch {
      return { success: false, error: 'invalid_input' };
    }
    return this.requestCreateSurvey(survey, deadline);
  }

  /**
   * Sends creation parameters while leaving business validation to the RPC.
   * @param survey - Survey content in the agreed creation model.
   * @param deadline - An explicit ISO timestamp or null.
   * @returns A validated identifier or a request error.
   */
  private async requestCreateSurvey(survey: CreateSurveyData, deadline: string | null): Promise<RepositoryResult<string>> {
    try {
      const { data, error } = await this.supabase.rpc('create_survey_with_questions', {
        p_category_id: survey.categoryId, p_title: survey.title,
        p_description: survey.description, p_deadline: deadline,
        p_questions: survey.questions,
      });
      if (error) return { success: false, error: 'request_failed' };
      return this.mapCreatedSurveyId(data);
    } catch {
      return { success: false, error: 'request_failed' };
    }
  }

  /**
   * Validates the UUID returned by the creation RPC.
   * @param data - The untrusted RPC response.
   * @returns The generated ID or an invalid-data error.
   */
  private mapCreatedSurveyId(data: unknown): RepositoryResult<string> {
    try {
      return { success: true, data: readId(data, 'created survey ID') };
    } catch {
      return { success: false, error: 'invalid_data' };
    }
  }

  /**
   * Submits selected answers for one question through the atomic voting RPC.
   * @param questionId - The question to vote on; validated by the database.
   * @param optionIds - Selected answer IDs; selection rules are checked by the RPC.
   * @returns Success without data or a typed request error; writes are not retried.
   */
  async voteForQuestion(questionId: string, optionIds: readonly string[]): Promise<RepositoryResult<void>> {
    try {
      const { error } = await this.supabase.rpc('vote_for_question', {
        p_question_id: questionId,
        p_option_ids: [...optionIds],
      });
      if (error) return { success: false, error: 'request_failed' };
      return { success: true, data: undefined };
    } catch {
      return { success: false, error: 'request_failed' };
    }
  }
}
