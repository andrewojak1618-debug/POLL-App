import { Component, inject } from '@angular/core';

import { HighlightCard } from './highlight_card/highlight_card';
import { SurveyStore } from '../../shared/data/survey_store';



@Component({
  selector: 'app-survey-highlights',
  imports: [HighlightCard],
  templateUrl: './survey_highlights.html',
  styleUrl: './survey_highlights.scss',
})
export class SurveyHighlights {
  readonly store: SurveyStore = inject(SurveyStore);
}
