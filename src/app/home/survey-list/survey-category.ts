import type { CategorySelection } from './category-dropdown/survey-categories';
import type { SurveyListItem } from './survey-list-item';

/** Begrenzt die Liste auf die gewählte Kategorie.
 * @param surveys - Bereits nach Status gefilterte Umfragen.
 * @param category - Kategorie oder All Surveys für alle Kategorien.
 * @returns Passende Umfragen in unveränderter Reihenfolge.
 */
export function filterSurveysByCategory(
  surveys: readonly SurveyListItem[],
  category: CategorySelection,
): readonly SurveyListItem[] {
  return surveys.filter((survey: SurveyListItem): boolean =>
    category === 'All Surveys' || survey.category === category,
  );
}
