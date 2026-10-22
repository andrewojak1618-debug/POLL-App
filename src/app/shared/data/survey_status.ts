import type { Survey } from '../models/survey';

export type SurveyStatus = 'active' | 'past';

/** Filtert Umfragen anhand ihres Endzeitpunkts; ohne Endzeit bleiben sie aktiv.
 * @param surveys - Zu filternde Umfragen.
 * @param status - Gewünschter Status.
 * @param now - Aktueller Zeitpunkt in Millisekunden.
 * @returns Passende Umfragen in ihrer ursprünglichen Reihenfolge.
 */
export function filterSurveysByStatus<T extends Pick<Survey, 'endsAt'>>(
  surveys: readonly T[],
  status: SurveyStatus,
  now: number,
): readonly T[] {
  return surveys.filter((survey: T): boolean => {
    const isPast: boolean = survey.endsAt !== null && survey.endsAt <= now;
    return status === 'past' ? isPast : !isPast;
  });
}
