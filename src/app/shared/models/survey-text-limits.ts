import type { CreateSurveyData, CreateSurveyQuestionData } from './create_survey_data';

export const MAX_QUESTION_LENGTH: number = 200;
export const MAX_DESCRIPTION_LENGTH: number = 1000;

/** Checks text limits before a creation request leaves the application.
 * @param survey - Proposed survey, without modifying or truncating its content.
 * @returns Whether every limited field fits its maximum length.
 */
export function hasValidSurveyTextLengths(survey: CreateSurveyData): boolean {
  return (survey.description?.length ?? 0) <= MAX_DESCRIPTION_LENGTH
    && survey.questions.every((question: CreateSurveyQuestionData): boolean => question.text.length <= MAX_QUESTION_LENGTH);
}
