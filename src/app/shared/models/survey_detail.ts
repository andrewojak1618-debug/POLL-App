import type { Survey } from './survey';
import type { SurveyCategoryData } from './survey_category_data';
import type { SurveyOption } from './survey_option';
import type { SurveyQuestionData } from './survey_question_data';

/** A question with its options sorted by position. */
export interface SurveyQuestionDetail extends SurveyQuestionData {
  readonly options: readonly SurveyOption[];
}

/** A complete survey with its category and questions sorted by position. */
export interface SurveyDetail extends Survey {
  readonly category: SurveyCategoryData;
  readonly questions: readonly SurveyQuestionDetail[];
}
