import { Component, input, output, signal, viewChild } from '@angular/core';
import type { InputSignal, OutputEmitterRef, Signal, WritableSignal } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';

import { CategoryPicker } from '../category_picker/category_picker';

import { resolveSurveyDeadline } from '../survey_form_deadline';
import { toCreateSurveyData } from '../survey_form_mapping';
import type { SurveyFormValue } from '../survey_form_mapping';
import type { CreateSurveyData } from '../../shared/models/create_survey_data';
import { showFieldError } from '../show_field_error';
import { SurveyQuestion } from '../survey_question/survey_question_model';
import { SurveyQuestionComponent } from '../survey_question/survey_question';
import type { SurveyCategoryData } from '../../shared/models/survey_category_data';

type SurveyFields = Record<'name' | 'endDate' | 'category' | 'description', FormControl<string>>;

@Component({
  selector: 'app-survey-form',
  imports: [ReactiveFormsModule, SurveyQuestionComponent, CategoryPicker],
  templateUrl: './survey_form.html',
  styleUrl: './survey_form.scss',
})
export class SurveyForm {
  private readonly formDirective: Signal<FormGroupDirective> = viewChild.required(FormGroupDirective);
  readonly showError: typeof showFieldError = showFieldError;
  readonly validatedSurvey: OutputEmitterRef<CreateSurveyData> = output<CreateSurveyData>();
  readonly conversionError: WritableSignal<string | null> = signal<string | null>(null);
  readonly categories: InputSignal<readonly SurveyCategoryData[]> = input<readonly SurveyCategoryData[]>([]);
  readonly fields: SurveyFields = {
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    endDate: new FormControl('', { nonNullable: true }),
    category: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
  };
  readonly questions: FormArray<SurveyQuestion> = new FormArray<SurveyQuestion>([new SurveyQuestion()]);
  readonly form: FormGroup<SurveyFields & { questions: FormArray<SurveyQuestion> }> = new FormGroup({ ...this.fields, questions: this.questions });

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

  /** Adds a question with three empty answers while preserving existing question controls. */
  addQuestion(): void {
    const question: SurveyQuestion = new SurveyQuestion();
    question.addAnswer();
    this.questions.push(question);
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
