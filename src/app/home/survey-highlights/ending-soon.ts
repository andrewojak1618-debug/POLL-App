import type { SurveyListItem } from '../survey-list/survey-list-item';

const ENDING_SOON_WINDOW_MS: number = 24 * 60 * 60 * 1000;

/** Wählt laufende Umfragen aus, die in spätestens 24 Stunden enden.
 * @param surveys - Gemeinsame Umfragedaten der Home-Seite.
 * @param now - Aktueller Zeitpunkt in Millisekunden.
 * @returns Passende Umfragen, aufsteigend nach Endzeitpunkt sortiert.
 */
export function getEndingSoonSurveys(
  surveys: readonly SurveyListItem[],
  now: number,
): readonly SurveyListItem[] {
  return surveys
    .filter((survey: SurveyListItem): boolean =>
      survey.endsAt !== null && survey.endsAt > now && survey.endsAt <= now + ENDING_SOON_WINDOW_MS,
    )
    .sort((first: SurveyListItem, second: SurveyListItem): number =>
      (first.endsAt ?? 0) - (second.endsAt ?? 0),
    );
}
