import { Injectable, signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import type { CategorySelection } from './category-dropdown/survey-categories';
import type { SurveyStatus } from './survey-status';

/** Keeps Home filter selections while navigating within the app. */
@Injectable({ providedIn: 'root' })
export class HomeFilterState {
  readonly status: WritableSignal<SurveyStatus> = signal('active');
  readonly category: WritableSignal<CategorySelection> = signal('All Surveys');
}