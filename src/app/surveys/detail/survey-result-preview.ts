import type { SurveyQuestionDetail } from '../../shared/models/survey_detail';
import type { SurveyOption } from '../../shared/models/survey_option';

/** Adds unsaved selections to a copy of the persisted results for local preview only.
 * @param questions - Persisted question totals, never mutated.
 * @param selected - Current form selections indexed by question identifier.
 * @param savedIds - Questions already acknowledged by the server.
 * @returns Copied questions with tentative counts for the current selection.
 */
export function previewSurveyResults(
  questions: readonly SurveyQuestionDetail[], selected: ReadonlyMap<string, readonly string[]>,
  savedIds: readonly string[],
): readonly SurveyQuestionDetail[] {
  return questions.map((question: SurveyQuestionDetail): SurveyQuestionDetail => ({
    ...question,
    options: question.options.map((option: SurveyOption): SurveyOption => ({
      ...option,
      voteCount: option.voteCount + (!savedIds.includes(question.id) && selected.get(question.id)?.includes(option.id) ? 1 : 0),
    })),
  }));
}
