const POSTGRES_INTEGER_MAX: number = 2147483647;

/**
 * Rejects invalid backend data without exposing its contents.
 * @param valid - Whether the value satisfies the required data contract.
 * @param field - Field or rule name included in the validation error.
 */
export function requireData(valid: boolean, field: string): void {
  if (!valid) throw new Error(`Invalid survey data: ${field}`);
}
/**
 * Narrows an unknown database row to a record.
 * @param value - Untrusted database row to validate.
 * @returns The validated non-null object as a record.
 */
export function readRow(value: unknown): Record<string, unknown> {
  requireData(typeof value === 'object' && value !== null && !Array.isArray(value), 'row');
  return value as Record<string, unknown>;
}
/**
 * Reads a required non-empty text field.
 * @param value - Untrusted text value; whitespace-only strings are rejected.
 * @param field - Field name used in validation errors.
 * @returns The original non-empty string without trimming it.
 */
export function readText(value: unknown, field: string): string {
  requireData(typeof value === 'string' && value.trim().length > 0, field);
  return value as string;
}
/**
 * Reads a nullable description without treating missing data as null.
 * @param value - Untrusted description, explicitly null when absent.
 * @returns The original description, or null when explicitly absent.
 */
export function readDescription(value: unknown): string | null {
  requireData(value === null || typeof value === 'string', 'description');
  return value as string | null;
}
/**
 * Reads a UUID stored by the database.
 * @param value - Untrusted UUID value.
 * @param field - Field name used in validation errors.
 * @returns The validated UUID in lowercase.
 */
export function readId(value: unknown, field: string): string {
  const id: string = readText(value, field);
  requireData(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id), field);
  return id.toLowerCase();
}
/**
 * Reads a non-negative PostgreSQL integer.
 * @param value - Untrusted count or position.
 * @param field - Field name used in validation errors.
 * @returns An integer between zero and the PostgreSQL integer maximum.
 */
export function readInteger(value: unknown, field: string): number {
  requireData(typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= POSTGRES_INTEGER_MAX, field);
  return value as number;
}
/**
 * Reads a boolean without coercing strings or numbers.
 * @param value - Untrusted multiple-answer flag.
 * @returns The validated flag; true permits multiple answers.
 */
export function readBoolean(value: unknown): boolean {
  requireData(typeof value === 'boolean', 'allows_multiple_answers');
  return value as boolean;
}
/**
 * Reads an array without accepting missing relationships.
 * @param value - Untrusted relationship collection.
 * @returns The array with its elements still requiring validation.
 */
export function readArray(value: unknown): readonly unknown[] {
  requireData(Array.isArray(value), 'array');
  return value as readonly unknown[];
}
