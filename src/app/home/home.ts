import { Component, signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { RouterLink } from '@angular/router';
import { createSurveyExamples } from './survey-list/survey-examples';
import type { SurveyListItem } from './survey-list/survey-list-item';
import { SurveyList } from './survey-list/survey-list';
import { SurveyHighlights } from './survey-highlights/survey-highlights';
import { PrimaryButton } from '../shared/ui/primary-button/primary-button';

@Component({
  selector: 'app-home',
  imports: [PrimaryButton, SurveyHighlights, SurveyList, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly now: WritableSignal<number> = signal(Date.now());
  readonly surveys: readonly SurveyListItem[] = createSurveyExamples(this.now());

  /** Aktualisiert zeitabhängige Filter; die Subscription endet mit der Komponente. */
  constructor() {
    interval(1000).pipe(takeUntilDestroyed()).subscribe((): void => {
      this.now.set(Date.now());
    });
  }
}
