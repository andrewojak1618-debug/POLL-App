import { Component, input } from '@angular/core';
import type { InputSignal } from '@angular/core';
import type { SurveyHighlight } from '../survey-highlight';

@Component({
  selector: 'app-highlight-card',
  templateUrl: './highlight-card.html',
  styleUrl: './highlight-card.scss',
})
export class HighlightCard {
  readonly survey: InputSignal<SurveyHighlight> = input.required<SurveyHighlight>();
}
