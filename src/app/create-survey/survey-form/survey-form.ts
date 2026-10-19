import { Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SURVEY_CATEGORIES } from '../../home/survey-list/category-dropdown/survey-categories';
import { SurveyQuestion } from '../survey_question/survey_question_model';
import { SurveyQuestionComponent } from '../survey_question/survey_question';
import type { SurveyCategory } from '../../home/survey-list/category-dropdown/survey-categories';

@Component({
  selector: 'app-survey-form',
  imports: [ReactiveFormsModule, SurveyQuestionComponent],
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
  };
  readonly questions = new FormArray<SurveyQuestion>([new SurveyQuestion()]);
  readonly form = new FormGroup({ ...this.fields, questions: this.questions });

  /** Ergänzt eine unabhängige Frage mit zwei Antworten. */
  addQuestion(): void {
    this.questions.push(new SurveyQuestion());
  }

  /** Leert die erste Frage oder entfernt eine zusätzliche Frage vollständig. */
  removeQuestion(index: number): void {
    if (index === 0) {
      this.questions.at(0).controls.question.setValue('');
      return;
    }
    this.questions.removeAt(index);
  }
  /** Leert ein Textfeld und setzt den Fokus zur weiteren Eingabe zurück. */
  clear(control: FormControl<string>, input: HTMLInputElement | HTMLTextAreaElement): void {
    control.setValue('');
    input.focus();
  }
}
