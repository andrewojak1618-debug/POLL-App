import { showFieldError } from '../show_field_error';
import { Component, ElementRef, input, output, viewChildren } from '@angular/core';
import type { Signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SurveyQuestion } from './survey_question_model';

@Component({
  selector: 'app-survey-question',
  imports: [ReactiveFormsModule],
  templateUrl: './survey_question.html',
  styleUrl: './survey_question.scss',
})
export class SurveyQuestionComponent {
  readonly showError = showFieldError;
  private readonly answerInputs: Signal<readonly ElementRef<HTMLInputElement>[]> =
    viewChildren<ElementRef<HTMLInputElement>>('answerInput');

  readonly question = input.required<SurveyQuestion>();
  readonly number = input.required<number>();
  readonly remove = output<void>();

  /** Removes or clears an answer and focuses the nearest remaining input.
   * @param index - Position of the answer to remove or clear.
   */
  removeAnswer(index: number): void {
    const count: number = this.question().answers.length;
    const targetIndex: number = count <= 2 ? index : index < count - 1 ? index + 1 : index - 1;
    const target: HTMLInputElement = this.answerInputs()[targetIndex].nativeElement;
    this.question().removeAnswer(index);
    target.focus();
  }
}
