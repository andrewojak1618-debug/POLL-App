import { Component, input, output, signal, viewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';

import { resolveSurveyDeadline } from '../survey_form_deadline';
import { toCreateSurveyData } from '../survey_form_mapping';
import type { SurveyFormValue } from '../survey_form_mapping';
import type { CreateSurveyData } from '../../shared/models/create_survey_data';
import { showFieldError } from '../show_field_error';
import { SurveyQuestion } from '../survey_question/survey_question_model';
import { SurveyQuestionComponent } from '../survey_question/survey_question';
import type { SurveyCategoryData } from '../../shared/models/survey_category_data';

@Component({
  selector: 'app-survey-form',
  imports: [ReactiveFormsModule, SurveyQuestionComponent],
  templateUrl: './survey_form.html',
  styleUrl: './survey_form.scss',
})
export class SurveyForm {
  private readonly formDirective = viewChild.required(FormGroupDirective);
  readonly showError = showFieldError;
  readonly validatedSurvey = output<CreateSurveyData>();
  readonly conversionError = signal<string | null>(null);
  readonly categories = input<readonly SurveyCategoryData[]>([]);
  readonly fields = {
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    endDate: new FormControl('', { nonNullable: true }),
    category: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
  };
  readonly questions = new FormArray<SurveyQuestion>([new SurveyQuestion()]);
  readonly form = new FormGroup({ ...this.fields, questions: this.questions });

  /**
   * Marks invalid fields as touched; otherwise emits creation data or exposes a date conversion error.
   */
  submit(): void {
    this.conversionError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value: SurveyFormValue = this.form.getRawValue();
    try {
      this.validatedSurvey.emit(toCreateSurveyData(value, resolveSurveyDeadline(value.endDate)));
    } catch {
      this.conversionError.set('Enter a valid end date.');
    }
  }
  /** Restores the initial empty form after confirmed persistence. */
  resetAfterSave(): void {
    this.questions.clear();
    this.questions.push(new SurveyQuestion());
    this.formDirective().resetForm();
    this.conversionError.set(null);
  }

  /** Creates independent question controls so adding a question cannot change existing answers. */
  addQuestion(): void {
    this.questions.push(new SurveyQuestion());
  }

  /**
   * Clears only the first question text, or removes an additional question.
   * @param index - Zero-based question position; zero clears only the first question text.
   */
  removeQuestion(index: number): void {
    if (index === 0) {
      this.questions.at(0).controls.question.setValue('');
      return;
    }
    this.questions.removeAt(index);
  }
  /**
   * Returns focus to the cleared field so keyboard users can immediately replace its content.
   * @param control - Text control whose value is cleared.
   * @param input - Associated input or textarea that receives focus.
   */
  clear(control: FormControl<string>, input: HTMLInputElement | HTMLTextAreaElement): void {
    control.setValue('');
    input.focus();
  }
}
