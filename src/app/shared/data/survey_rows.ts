import type { Survey } from '../models/survey';
import type { SurveyCategoryData } from '../models/survey_category_data';
import type { SurveyQuestionData } from '../models/survey_question_data';
import type { SurveyOption } from '../models/survey_option';
import { readRow, readId, readText, readDescription, readInteger, readBoolean } from './data_checks';
import { readDeadline, readTimestamp } from './survey_dates';

/** Validates and maps a category row. */
export function mapCategory(value: unknown): SurveyCategoryData {
  const row: Record<string, unknown> = readRow(value);
  return { id: readId(row['id'], 'id'), name: readText(row['name'], 'name'), slug: readText(row['slug'], 'slug') };
}
/** Validates and maps survey metadata. */
export function mapSurvey(value: unknown): Survey {
  const row: Record<string, unknown> = readRow(value);
  return {
    id: readId(row['id'], 'id'), categoryId: readId(row['category_id'], 'category_id'),
    title: readText(row['title'], 'title'), description: readDescription(row['description']),
    endsAt: readDeadline(row['deadline']), createdAt: readTimestamp(row['created_at']),
  };
}
/** Validates and maps a question row. */
export function mapQuestion(value: unknown): SurveyQuestionData {
  const row: Record<string, unknown> = readRow(value);
  return {
    id: readId(row['id'], 'id'), surveyId: readId(row['survey_id'], 'survey_id'),
    text: readText(row['text'], 'text'), position: readInteger(row['position'], 'position'),
    allowsMultipleAnswers: readBoolean(row['allows_multiple_answers']),
  };
}
/** Validates and maps an answer option row. */
export function mapOption(value: unknown): SurveyOption {
  const row: Record<string, unknown> = readRow(value);
  return {
    id: readId(row['id'], 'id'), questionId: readId(row['question_id'], 'question_id'),
    text: readText(row['text'], 'text'), position: readInteger(row['position'], 'position'),
    voteCount: readInteger(row['vote_count'], 'vote_count'),
  };
}
