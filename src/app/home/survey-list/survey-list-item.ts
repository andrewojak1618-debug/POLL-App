import type { SurveyCategory } from './category-dropdown/survey-categories';

export interface SurveyListItem {
  readonly id: string;
  readonly category: SurveyCategory;
  readonly title: string;
  readonly deadlineLabel: string;
  readonly endsAt: number | null;
}
