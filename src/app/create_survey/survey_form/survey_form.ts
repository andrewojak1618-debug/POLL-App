import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import type { InputSignal, OutputEmitterRef, Signal, WritableSignal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
  private readonly formElement: Signal<ElementRef<HTMLFormElement> | undefined> = viewChild('formElement');
  private readonly dateInput: Signal<ElementRef<HTMLInputElement> | undefined> = viewChild('dateInput');
  readonly minimumDate: string = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
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
    this.validateEndDate();
    if (this.conversionError()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusInvalidField();
      return;
    }
    const value: SurveyFormValue = this.form.getRawValue();
    this.emitValidSurvey(value);
  }
  /** Focuses the first required field so errors above the submit button are discoverable. */
  private focusInvalidField(): void {
    const selector: string = this.fields.name.valid && this.fields.category.invalid
      ? '#survey_category' : 'input.ng-invalid, textarea.ng-invalid';
    this.formElement()?.nativeElement.querySelector<HTMLElement>(selector)?.focus();
  }
  /** Validates manual dates without treating an incomplete native date as an empty field. */
  validateEndDate(): void {
    this.conversionError.set(null);
    try {
      if (this.dateInput()?.nativeElement.validity.badInput) throw new Error('Incomplete date');
      const deadline: number = resolveSurveyDeadline(this.fields.endDate.value);
      if (deadline <= Date.now()) this.conversionError.set('Choose today or a future end date.');
    } catch {
      this.conversionError.set('Enter a valid end date.');
    }
  }

  /** Rejects expired deadlines immediately before emitting creation data.
   * @param value - Complete form snapshot whose inputs remain unchanged on failure.
   */
  private emitValidSurvey(value: SurveyFormValue): void {
    const deadline: number | null = resolveSurveyDeadline(value.endDate);
    if (deadline !== null && deadline <= Date.now()) {
      this.conversionError.set('Choose today or a future end date.');
      return;
    }
    this.validatedSurvey.emit(toCreateSurveyData(value, deadline));
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
    if (control === this.fields.endDate) this.validateEndDate();
    input.focus();
  }
}
