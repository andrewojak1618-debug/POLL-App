export const SURVEY_CATEGORIES = [
  'All Surveys',
  'Team Activities',
  'Health & Wellness',
  'Gaming & Entertainment',
  'Education & Learning',
  'Lifestyle & Preferences',
  'Technology & Innovation',
] as const;

export type CategorySelection = (typeof SURVEY_CATEGORIES)[number];
export type SurveyCategory = Exclude<CategorySelection, 'All Surveys'>;
