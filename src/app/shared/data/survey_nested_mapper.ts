import type { SurveyDetail } from '../models/survey_detail';
import { readArray, readRow, requireData } from './data_checks';
import { mapSurveyDetail } from './survey_detail_mapper';

/**
 * Adapts nested database relationships to the existing detail validation.
 * @param value - A survey row including category, questions and options.
 * @returns A validated survey with questions and options sorted by position.
 */
export function mapNestedSurvey(value: unknown): SurveyDetail {
  const row: Record<string, unknown> = readRow(value);
  const questions: readonly unknown[] = readArray(row['questions']);
  const options: readonly unknown[] = questions.flatMap(readQuestionOptions);
  return mapSurveyDetail(row, row['category'], questions, options);
}

/**
 * Reads options and checks their relationship to the enclosing question.
 * @param value - A question row with its nested options.
 * @returns The options belonging to this question.
 */
function readQuestionOptions(value: unknown): readonly unknown[] {
  const question: Record<string, unknown> = readRow(value);
  const options: readonly unknown[] = readArray(question['options']);
  requireData(options.every((option: unknown): boolean =>
    readRow(option)['question_id'] === question['id']), 'nested option relationship');
  return options;
}
