/** Known failures exposed by the survey data layer. */
export type RepositoryError = 'request_failed' | 'invalid_data' | 'invalid_id' | 'invalid_input';

/** Separates successful data (including empty lists) from database failures. */
export type RepositoryResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: RepositoryError };
