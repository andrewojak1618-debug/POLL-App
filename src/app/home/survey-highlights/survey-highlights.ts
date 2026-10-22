import { Component, inject } from '@angular/core';
import { HighlightCard } from './highlight-card/highlight-card';
import { SurveyStore } from '../../shared/data/survey_store';



@Component({
  selector: 'app-survey-highlights',
  imports: [HighlightCard],
  templateUrl: './survey-highlights.html',
  styleUrl: './survey-highlights.scss',
})
export class SurveyHighlights {
  readonly store: SurveyStore = inject(SurveyStore);
}
