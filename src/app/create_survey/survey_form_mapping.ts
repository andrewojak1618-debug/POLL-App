import type { CreateSurveyData, CreateSurveyQuestionData } from '../shared/models/create_survey_data';

/** Raw values of a question in the creation form, in visible answer order. */
export interface SurveyQuestionValue {
  readonly question: string;
  readonly multipleAnswers: boolean;
  readonly answers: readonly string[];
}

/** Snapshot of the creation form before conversion to persistence data. */
export interface SurveyFormValue {
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly endDate: string;
  readonly questions: readonly SurveyQuestionValue[];
}

/**
 * Converts validated form content using the separately resolved deadline.
 * @param value - A single raw form snapshot.
 * @param endsAt - Explicitly resolved deadline; null is allowed only for an empty date field.
 * @returns Creation data with question and answer order preserved.
 */
export function toCreateSurveyData(value: SurveyFormValue, endsAt: number | null): CreateSurveyData {
  if ((value.endDate === '') !== (endsAt === null) || (endsAt !== null && !Number.isFinite(endsAt))) {
    throw new Error('The selected end date needs an explicitly resolved deadline.');
  }
  return {
    categoryId: value.category,
    title: value.name,
    description: value.description.trim() === '' ? null : value.description,
    endsAt,
    questions: value.questions.map(toCreateQuestion),
  };
}

/** Maps one question without adding generated identifiers or vote counts.
 * @param value - Question and answer values in display order.
 * @returns The question content expected by the creation model.
 */
function toCreateQuestion(value: SurveyQuestionValue): CreateSurveyQuestionData {
  return {
    text: value.question,
    allowsMultipleAnswers: value.multipleAnswers,
    options: value.answers.map((text: string): { readonly text: string } => ({ text })),
  };
}