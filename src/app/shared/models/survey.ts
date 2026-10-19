/** Persisted survey metadata shared by all its questions. */
export interface Survey {
  readonly id: string;
  readonly categoryId: string;
  readonly title: string;
  readonly description: string | null;
  /** Deadline in Unix milliseconds; null means no deadline. */
  readonly endsAt: number | null;
  /** Creation time in Unix milliseconds. */
  readonly createdAt: number;
}
