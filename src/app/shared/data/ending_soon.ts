import type { Survey } from '../models/survey';

const MAX_HIGHLIGHTS: number = 4;

/** Selects the next four active surveys with a deadline.
 * @param surveys - Gemeinsame Umfragedaten der Home-Seite.
 * @param now - Aktueller Zeitpunkt in Millisekunden.
 * @returns Passende Umfragen, aufsteigend nach Endzeitpunkt sortiert.
 */
export function getEndingSoonSurveys<T extends Pick<Survey, 'endsAt'>>(
  surveys: readonly T[],
  now: number,
): readonly T[] {
  return surveys
    .filter((survey: T): boolean =>
      survey.endsAt !== null && survey.endsAt > now,
    )
    .sort((first: T, second: T): number =>
      (first.endsAt ?? 0) - (second.endsAt ?? 0),
    ).slice(0, MAX_HIGHLIGHTS);
}
