import { Injectable } from '@angular/core';

const STORAGE_PREFIX: string = 'poll_app_completed_';

/** Remembers completed participation on this browser without storing answer choices. */
@Injectable({ providedIn: 'root' })
export class SurveyParticipation {
  private readonly completed: Set<string> = new Set<string>();

  /** Checks browser-local completion; unavailable storage falls back to memory.
   * @param surveyId - Survey whose completed participation is queried.
   * @returns Whether this browser has acknowledged completing the survey.
   */
  hasCompleted(surveyId: string): boolean {
    try {
      return this.completed.has(surveyId) || localStorage.getItem(STORAGE_PREFIX + surveyId) === 'true';
    } catch {
      return this.completed.has(surveyId);
    }
  }

  /** Records completion only after every answer has been acknowledged.
   * @param surveyId - Successfully completed survey identifier.
   */
  complete(surveyId: string): void {
    this.completed.add(surveyId);
    try {
      localStorage.setItem(STORAGE_PREFIX + surveyId, 'true');
    } catch {
      // Browser storage can be disabled; in-memory duplicate protection still applies.
    }
  }
}
