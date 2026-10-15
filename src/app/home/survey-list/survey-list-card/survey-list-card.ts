import { Component, input } from '@angular/core';
import type { InputSignal } from '@angular/core';
import type { SurveyListItem } from '../survey-list-item';

@Component({
  selector: 'app-survey-list-card',
  templateUrl: './survey-list-card.html',
  styleUrl: './survey-list-card.scss',
})
export class SurveyListCard {
  readonly survey: InputSignal<SurveyListItem> = input.required<SurveyListItem>();
}
