/** A persisted question, independent of Angular form controls. */
export interface SurveyQuestionData {
  readonly id: string;
  readonly surveyId: string;
  readonly text: string;
  /** Zero-based order within the parent survey. */
  readonly position: number;
  readonly allowsMultipleAnswers: boolean;
}
