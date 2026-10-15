import type { SurveyListItem } from './survey-list-item';

export type SurveyStatus = 'active' | 'past';

/** Filtert Umfragen anhand ihres Endzeitpunkts; ohne Endzeit bleiben sie aktiv.
 * @param surveys - Zu filternde Umfragen.
 * @param status - Gewünschter Status.
 * @param now - Aktueller Zeitpunkt in Millisekunden.
 * @returns Passende Umfragen in ihrer ursprünglichen Reihenfolge.
 */
export function filterSurveysByStatus(
  surveys: readonly SurveyListItem[],
  status: SurveyStatus,
  now: number,
): readonly SurveyListItem[] {
  return surveys.filter((survey: SurveyListItem): boolean => {
    const isPast: boolean = survey.endsAt !== null && survey.endsAt <= now;
    return status === 'past' ? isPast : !isPast;
  });
}
