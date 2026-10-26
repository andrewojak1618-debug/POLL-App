import { Component, input, model } from '@angular/core';
import type { InputSignal, ModelSignal } from '@angular/core';
import type { SurveyQuestionDetail } from '../../shared/models/survey_detail';
import { SurveyEmptyResults } from './survey_empty_results';
import { surveyAnswerLetter } from './survey_answer_letter';

@Component({
  selector: 'app-survey-results',
  imports: [SurveyEmptyResults],
  templateUrl: './survey_results.html',
  styleUrl: './survey_results.scss',
  host: { role: 'region', 'aria-labelledby': 'results_title' },
})
export class SurveyResults {
  readonly questions: InputSignal<readonly SurveyQuestionDetail[]> = input.required<readonly SurveyQuestionDetail[]>();
  readonly hasResults: InputSignal<boolean> = input.required<boolean>();
  readonly questionVoteTotals: InputSignal<ReadonlyMap<string, number>> = input.required<ReadonlyMap<string, number>>();
  readonly answerPercentages: InputSignal<ReadonlyMap<string, number>> = input.required<ReadonlyMap<string, number>>();
  readonly expanded: ModelSignal<boolean> = model(true);
  readonly answerLetter: (index: number) => string = surveyAnswerLetter;
}
