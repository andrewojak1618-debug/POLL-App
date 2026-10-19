import { requireData } from './data_checks';

/** Converts an explicit-offset timestamp to Unix milliseconds; truncates microseconds. */
export function readTimestamp(value: unknown): number {
  requireData(typeof value === 'string', 'timestamp');
  const match: RegExpMatchArray | null = (value as string).match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}(?::?\d{2})?)$/,
  );
  requireData(match !== null, 'timestamp with timezone');
  const parts: RegExpMatchArray = match!;
  const local: string = `${parts[1]}-${parts[2]}-${parts[3]}T${parts[4]}:${parts[5]}:${parts[6]}`;
  const calendar: Date = new Date(`${local}Z`);
  requireData(Number.isFinite(calendar.getTime()) && calendar.toISOString().slice(0, 19) === local, 'calendar date');
  const result: number = Date.parse(`${local}.${(parts[7] ?? '').padEnd(3, '0').slice(0, 3)}${normalizeOffset(parts[8])}`);
  requireData(Number.isFinite(result), 'timestamp');
  return result;
}
/** Normalizes PostgreSQL and ISO offsets without choosing a user timezone. */
function normalizeOffset(offset: string): string {
  if (offset === 'Z') return offset;
  const digits: string = offset.slice(1).replace(':', '');
  const hours: number = Number(digits.slice(0, 2));
  const minutes: number = Number(digits.slice(2) || '0');
  requireData(hours <= 23 && minutes <= 59, 'timezone offset');
  return `${offset[0]}${digits.slice(0, 2)}:${digits.slice(2) || '00'}`;
}
/** Preserves an absent deadline; missing or invalid values are rejected. */
export function readDeadline(value: unknown): number | null {
  return value === null ? null : readTimestamp(value);
}
/** Serializes an existing instant for persistence; does not convert a calendar date. */
export function writeTimestamp(value: number | null): string | null {
  if (value === null) return null;
  requireData(Number.isSafeInteger(value) && Number.isFinite(new Date(value).getTime()), 'timestamp milliseconds');
  return new Date(value).toISOString();
}
