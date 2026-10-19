/** Answer text before persistence; array order determines its position. */
export interface CreateSurveyOptionData {
  readonly text: string;
}

/** Question content before persistence, without generated IDs or vote counts. */
export interface CreateSurveyQuestionData {
  readonly text: string;
  readonly allowsMultipleAnswers: boolean;
  readonly options: readonly CreateSurveyOptionData[];
}

/** Data for creating a survey; validation and form conversion are separate steps. */
export interface CreateSurveyData {
  readonly categoryId: string;
  readonly title: string;
  readonly description: string | null;
  /** Deadline in Unix milliseconds; null means no deadline. */
  readonly endsAt: number | null;
  readonly questions: readonly CreateSurveyQuestionData[];
}
