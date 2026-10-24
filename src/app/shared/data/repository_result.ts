/** Known failures exposed by the survey data layer. */
export const REPOSITORY_ERROR = {
  REQUEST_FAILED: 'request_failed',
  INVALID_DATA: 'invalid_data',
  INVALID_ID: 'invalid_id',
  INVALID_INPUT: 'invalid_input',
} as const;

export type RepositoryError = typeof REPOSITORY_ERROR[keyof typeof REPOSITORY_ERROR];

/** Separates successful data (including empty lists) from database failures. */
export type RepositoryResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: RepositoryError };
