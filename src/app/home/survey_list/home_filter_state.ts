import { Injectable, signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';

import type { SurveyStatus } from './survey_status';

/** Keeps the selected Home status while navigating within the app. */
@Injectable({ providedIn: 'root' })
export class HomeFilterState {
  readonly status: WritableSignal<SurveyStatus> = signal('active');
  readonly categoryId: WritableSignal<string | null> = signal<string | null>(null);
}