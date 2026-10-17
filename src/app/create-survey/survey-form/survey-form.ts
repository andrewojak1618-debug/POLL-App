import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SURVEY_CATEGORIES } from '../../home/survey-list/category-dropdown/survey-categories';
import type { SurveyCategory } from '../../home/survey-list/category-dropdown/survey-categories';

@Component({
  selector: 'app-survey-form',
  imports: [ReactiveFormsModule],
  templateUrl: './survey-form.html',
  styleUrl: './survey-form.scss',
})
export class SurveyForm {
  readonly categories: readonly SurveyCategory[] = SURVEY_CATEGORIES.filter(
    (category): category is SurveyCategory => category !== 'All Surveys',
  );
  readonly fields = {
    name: new FormControl('', { nonNullable: true }),
    endDate: new FormControl('', { nonNullable: true }),
    category: new FormControl<SurveyCategory | ''>('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    question: new FormControl('', { nonNullable: true }),
    answerA: new FormControl('', { nonNullable: true }),
    answerB: new FormControl('', { nonNullable: true }),
    multipleAnswers: new FormControl(false, { nonNullable: true }),
  };
  readonly form = new FormGroup(this.fields);

  /** Leert ein Textfeld und setzt den Fokus zur weiteren Eingabe zurück. */
  clear(control: FormControl<string>, input: HTMLInputElement | HTMLTextAreaElement): void {
    control.setValue('');
    input.focus();
  }
}
