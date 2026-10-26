import { Component, ElementRef, input, output, viewChildren } from '@angular/core';
import type { InputSignal, OutputEmitterRef, Signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { showFieldError } from '../show_field_error';
import { SurveyQuestion } from './survey_question_model';

@Component({
  selector: 'app-survey-question',
  imports: [ReactiveFormsModule],
  templateUrl: './survey_question.html',
  styleUrl: './survey_question.scss',
})
export class SurveyQuestionComponent {
  readonly showError: typeof showFieldError = showFieldError;
  private readonly answerInputs: Signal<readonly ElementRef<HTMLInputElement>[]> =
    viewChildren<ElementRef<HTMLInputElement>>('answerInput');

  readonly question: InputSignal<SurveyQuestion> = input.required<SurveyQuestion>();
  readonly number: InputSignal<number> = input.required<number>();
  readonly remove: OutputEmitterRef<void> = output<void>();

  /** Removes or clears an answer and focuses the nearest remaining input.
   * @param index - Position of the answer to remove or clear.
   */
  removeAnswer(index: number): void {
    const count: number = this.question().answers.length;
    const targetIndex: number = count <= 2 || this.question().answers.at(index).value !== '' ? index : index < count - 1 ? index + 1 : index - 1;
    const target: HTMLInputElement = this.answerInputs()[targetIndex].nativeElement;
    this.question().removeAnswer(index);
    target.focus();
  }
}
