const DAY_IN_MS: number = 24 * 60 * 60 * 1000;

/**
 * Formats the remaining duration using the existing day-based card wording.
 * @param endsAt - Deadline in milliseconds, or null for an unlimited survey.
 * @param now - Current time in milliseconds.
 * @returns A deadline label with rounded-up remaining days or an ended status.
 */
export function formatSurveyDeadline(endsAt: number | null, now: number): string {
  if (endsAt === null) return 'No deadline';
  if (endsAt <= now) return 'Ended';
  const days: number = Math.ceil((endsAt - now) / DAY_IN_MS);
  return `Ends in ${days} ${days === 1 ? 'Day' : 'Days'}`;
}