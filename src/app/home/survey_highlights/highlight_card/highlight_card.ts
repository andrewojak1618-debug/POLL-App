import { Component, computed, input } from '@angular/core';
import type { InputSignal, Signal } from '@angular/core';

import type { SurveyDetail } from '../../../shared/models/survey_detail';
import { formatSurveyDeadline } from '../../../shared/data/survey_deadline';

type HighlightData = Pick<SurveyDetail, 'id' | 'title' | 'category' | 'endsAt'>;

@Component({
  selector: 'app-highlight-card',
  templateUrl: './highlight_card.html',
  styleUrl: './highlight_card.scss',
})
export class HighlightCard {
  readonly now: InputSignal<number> = input.required<number>();
  readonly deadlineLabel: Signal<string> = computed((): string => formatSurveyDeadline(this.survey().endsAt, this.now()));
  readonly survey: InputSignal<HighlightData> = input.required<HighlightData>();
}
