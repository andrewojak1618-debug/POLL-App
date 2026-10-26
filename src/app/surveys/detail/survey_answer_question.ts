import { Component, input } from '@angular/core';
import type { InputSignal } from '@angular/core';
import type { SurveyQuestionDetail } from '../../shared/models/survey_detail';
import { surveyAnswerLetter } from './survey_answer_letter';

@Component({
  selector: 'section[appSurveyAnswerQuestion]',
  templateUrl: './survey_answer_question.html',
  styleUrl: './survey_answer_question.scss',
})
export class SurveyAnswerQuestion {
  readonly question: InputSignal<SurveyQuestionDetail> = input.required<SurveyQuestionDetail>();
  readonly index: InputSignal<number> = input.required<number>();
  readonly saved: InputSignal<boolean> = input(false);
  readonly invalid: InputSignal<boolean> = input(false);
  readonly disabled: InputSignal<boolean> = input(false);
  readonly answerLetter: (index: number) => string = surveyAnswerLetter;
}
