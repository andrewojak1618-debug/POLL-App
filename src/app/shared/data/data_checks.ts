/** Rejects invalid backend data without exposing its contents. */
export function requireData(valid: boolean, field: string): void {
  if (!valid) throw new Error(`Invalid survey data: ${field}`);
}
/** Narrows an unknown database row to a record. */
export function readRow(value: unknown): Record<string, unknown> {
  requireData(typeof value === 'object' && value !== null && !Array.isArray(value), 'row');
  return value as Record<string, unknown>;
}
/** Reads a required non-empty text field. */
export function readText(value: unknown, field: string): string {
  requireData(typeof value === 'string' && value.trim().length > 0, field);
  return value as string;
}
/** Reads a nullable description without treating missing data as null. */
export function readDescription(value: unknown): string | null {
  requireData(value === null || typeof value === 'string', 'description');
  return value as string | null;
}
/** Reads a UUID stored by the database. */
export function readId(value: unknown, field: string): string {
  const id: string = readText(value, field);
  requireData(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id), field);
  return id.toLowerCase();
}
/** Reads a non-negative PostgreSQL integer. */
export function readInteger(value: unknown, field: string): number {
  requireData(typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 2147483647, field);
  return value as number;
}
/** Reads a boolean without coercing strings or numbers. */
export function readBoolean(value: unknown): boolean {
  requireData(typeof value === 'boolean', 'allows_multiple_answers');
  return value as boolean;
}
/** Reads an array without accepting missing relationships. */
export function readArray(value: unknown): readonly unknown[] {
  requireData(Array.isArray(value), 'array');
  return value as readonly unknown[];
}
