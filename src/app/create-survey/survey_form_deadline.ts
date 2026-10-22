const BERLIN_DATE: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

/** Resolves the final millisecond of the selected calendar day in Berlin.
 * @param date - Date input value in YYYY-MM-DD format, or empty for no deadline.
 * @returns Unix milliseconds at Berlin day end, or null without a date.
 */
export function resolveSurveyDeadline(date: string): number | null {
  if (date === '') return null;
  const midnight: number = Date.parse(date + 'T00:00:00.000Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(midnight)
    || new Date(midnight).toISOString().slice(0, 10) !== date) {
    throw new Error('Invalid calendar date.');
  }
  const nextDay: number = midnight + 86_400_000;
  let instant: number = nextDay;
  for (let attempt: number = 0; attempt < 3; attempt++) {
    instant += nextDay - berlinWallTime(instant);
  }
  return instant - 1;
}

/** Represents the Berlin wall clock as UTC for timezone offset correction.
 * @param instant - Actual Unix timestamp to inspect.
 * @returns Timestamp representing the local clock components as UTC.
 */
function berlinWallTime(instant: number): number {
  const parts: Record<string, string> = {};
  for (const part of BERLIN_DATE.formatToParts(instant)) parts[part.type] = part.value;
  return Date.parse(`${parts['year']}-${parts['month']}-${parts['day']}T${parts['hour']}:${parts['minute']}:${parts['second']}.000Z`);
}