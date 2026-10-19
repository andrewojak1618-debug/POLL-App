/** A persisted answer option belonging to exactly one question. */
export interface SurveyOption {
  readonly id: string;
  readonly questionId: string;
  readonly text: string;
  /** Zero-based order within the parent question. */
  readonly position: number;
  /** Non-negative selections of this option, not a survey participant count. */
  readonly voteCount: number;
}
