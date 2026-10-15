import { Component, Input } from '@angular/core';
import { HighlightCard } from './highlight-card/highlight-card';
import { getEndingSoonSurveys } from './ending-soon';
import type { SurveyListItem } from '../survey-list/survey-list-item';


@Component({
  selector: 'app-survey-highlights',
  imports: [HighlightCard],
  templateUrl: './survey-highlights.html',
  styleUrl: './survey-highlights.scss',
})
export class SurveyHighlights {
  @Input({ required: true }) surveys: readonly SurveyListItem[] = [];
  @Input({ required: true }) now: number = 0;

  /** Liefert die innerhalb der nächsten 24 Stunden endenden Umfragen. */
  get endingSoonSurveys(): readonly SurveyListItem[] {
    return getEndingSoonSurveys(this.surveys, this.now);
  }
}
