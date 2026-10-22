import { RouterLink } from '@angular/router';
import { formatSurveyDeadline } from '../../../shared/data/survey_deadline';
import { Component, computed, input } from '@angular/core';
import type { InputSignal, Signal } from '@angular/core';
import type { SurveyDetail } from '../../../shared/models/survey_detail';

type SurveyCardData = Pick<SurveyDetail, 'id' | 'category' | 'title' | 'endsAt'>;

@Component({
  selector: 'app-survey-list-card',
  imports: [RouterLink],
  templateUrl: './survey-list-card.html',
  styleUrl: './survey-list-card.scss',
})
export class SurveyListCard {
  readonly now: InputSignal<number> = input.required<number>();
  readonly deadlineLabel: Signal<string> = computed((): string => formatSurveyDeadline(this.survey().endsAt, this.now()));
  readonly survey: InputSignal<SurveyCardData> = input.required<SurveyCardData>();
}
