import { Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
    multipleAnswers: new FormControl(false, { nonNullable: true }),
  };
  readonly answers = new FormArray<FormControl<string>>([
    new FormControl('', { nonNullable: true }),
    new FormControl('', { nonNullable: true }),
  ]);
  readonly form = new FormGroup({ ...this.fields, answers: this.answers });

  /** Ergänzt eine leere Antwortmöglichkeit. */
  addAnswer(): void {
    this.answers.push(new FormControl('', { nonNullable: true }));
  }

  /** Entfernt eine Antwort; bei zwei verbleibenden Feldern wird nur der Inhalt geleert. */
  removeAnswer(index: number): void {
    if (this.answers.length <= 2) {
      this.answers.at(index).setValue('');
      return;
    }
    this.answers.removeAt(index);
  }

  /** Erzeugt fortlaufende Buchstaben auch nach Z (AA, AB, ...). */
  answerLabel(index: number): string {
    let label: string = '';
    for (let number: number = index + 1; number > 0; number = Math.floor((number - 1) / 26)) {
      label = String.fromCharCode(65 + (number - 1) % 26) + label;
    }
    return label;
  }

  /** Leert ein Textfeld und setzt den Fokus zur weiteren Eingabe zurück. */
  clear(control: FormControl<string>, input: HTMLInputElement | HTMLTextAreaElement): void {
    control.setValue('');
    input.focus();
  }
}
