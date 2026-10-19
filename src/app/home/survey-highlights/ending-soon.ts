import type { Survey } from '../../shared/models/survey';

const ENDING_SOON_HOURS: number = 24;
const MILLISECONDS_PER_HOUR: number = 60 * 60 * 1000;
const ENDING_SOON_WINDOW_MS: number = ENDING_SOON_HOURS * MILLISECONDS_PER_HOUR;

/** Wählt laufende Umfragen aus, die in spätestens 24 Stunden enden.
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
      survey.endsAt !== null && survey.endsAt > now && survey.endsAt <= now + ENDING_SOON_WINDOW_MS,
    )
    .sort((first: T, second: T): number =>
      (first.endsAt ?? 0) - (second.endsAt ?? 0),
    );
}
