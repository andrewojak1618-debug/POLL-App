import type { Survey } from '../models/survey';
import type { SurveyDetail, SurveyQuestionDetail } from '../models/survey_detail';
import type { SurveyCategoryData } from '../models/survey_category_data';
import type { SurveyQuestionData } from '../models/survey_question_data';
import type { SurveyOption } from '../models/survey_option';
import { readArray, requireData } from './data_checks';
import { mapSurvey, mapCategory, mapQuestion, mapOption } from './survey_rows';

/** Builds one detail from the survey row and its related category, questions and options. */
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
/** Adds independently sorted options to one question. */
function withOptions(question: SurveyQuestionData, options: readonly SurveyOption[]): SurveyQuestionDetail {
  const own: readonly SurveyOption[] = ordered(options.filter((o: SurveyOption): boolean => o.questionId === question.id));
  requireData(own.length >= 2, 'minimum options');
  return { ...question, options: own };
}
/** Sorts a copy and rejects duplicate IDs or positions within one parent. */
function ordered<T extends { readonly id: string; readonly position: number }>(rows: readonly T[]): readonly T[] {
  requireData(new Set(rows.map((row: T): string => row.id)).size === rows.length, 'duplicate IDs');
  requireData(new Set(rows.map((row: T): number => row.position)).size === rows.length, 'duplicate positions');
  return [...rows].sort((a: T, b: T): number => a.position - b.position);
}
