import type { Survey } from '../models/survey';
import type { SurveyDetail, SurveyQuestionDetail } from '../models/survey_detail';
import type { SurveyCategoryData } from '../models/survey_category_data';
import type { SurveyQuestionData } from '../models/survey_question_data';
import type { SurveyOption } from '../models/survey_option';
import { readArray, requireData } from './data_checks';
import { mapSurvey, mapCategory, mapQuestion, mapOption } from './survey_rows';

/**
 * Builds one detail from the survey row and its related category, questions and options.
 * @param row - Untrusted survey metadata.
 * @param categoryRow - Untrusted category belonging to the survey.
 * @param questionRows - Untrusted collection of questions belonging to the survey.
 * @param optionRows - Untrusted collection of answer options belonging to those questions.
 * @returns A validated survey with related questions and options sorted by position.
 */
export function mapSurveyDetail(row: unknown, categoryRow: unknown, questionRows: unknown, optionRows: unknown): SurveyDetail {
  const survey: Survey = mapSurvey(row);
  const category: SurveyCategoryData = mapCategory(categoryRow);
  const questions: readonly SurveyQuestionData[] = ordered(readArray(questionRows).map(mapQuestion));
  const options: readonly SurveyOption[] = readArray(optionRows).map(mapOption);
  requireData(category.id === survey.categoryId, 'category relationship');
  requireData(questions.length > 0 && questions.every((q: SurveyQuestionData): boolean => q.surveyId === survey.id), 'questions');
  requireData(new Set(options.map((o: SurveyOption): string => o.id)).size === options.length, 'option IDs');
  requireData(options.every((o: SurveyOption): boolean => questions.some((q: SurveyQuestionData): boolean => q.id === o.questionId)), 'option relationship');
  return { ...survey, category, questions: questions.map((q: SurveyQuestionData): SurveyQuestionDetail => withOptions(q, options)) };
}
/**
 * Adds independently sorted options to one question.
 * @param question - Validated question receiving its answer options.
 * @param options - Validated options from all questions in the survey.
 * @returns The question with at least two answer options sorted by position.
 */
function withOptions(question: SurveyQuestionData, options: readonly SurveyOption[]): SurveyQuestionDetail {
  const own: readonly SurveyOption[] = ordered(options.filter((o: SurveyOption): boolean => o.questionId === question.id));
  requireData(own.length >= 2, 'minimum options');
  return { ...question, options: own };
}
/**
 * Sorts a copy and rejects duplicate IDs or positions within one parent.
 * @param rows - Sibling records whose IDs and positions must be unique.
 * @returns A new array sorted by ascending position.
 */
function ordered<T extends { readonly id: string; readonly position: number }>(rows: readonly T[]): readonly T[] {
  requireData(new Set(rows.map((row: T): string => row.id)).size === rows.length, 'duplicate IDs');
  requireData(new Set(rows.map((row: T): number => row.position)).size === rows.length, 'duplicate positions');
  return [...rows].sort((a: T, b: T): number => a.position - b.position);
}
