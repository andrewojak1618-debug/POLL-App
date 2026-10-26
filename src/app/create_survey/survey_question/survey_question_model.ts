import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import { MAX_QUESTION_LENGTH } from '../../shared/models/survey-text-limits';

const ALPHABET_LENGTH: number = 26;
const FIRST_LETTER_CODE: number = 65;

export class SurveyQuestion extends FormGroup<{
  question: FormControl<string>;
  multipleAnswers: FormControl<boolean>;
  answers: FormArray<FormControl<string>>;
}> {
  /** Starts with the minimum two answers; each control owns its validation state. */
  constructor() {
    super({
      question: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(MAX_QUESTION_LENGTH)] }),
      multipleAnswers: new FormControl(false, { nonNullable: true }),
      answers: new FormArray([
        createRequiredTextControl(),
        createRequiredTextControl(),
      ], [Validators.required, Validators.minLength(2)]),
    });
  }

  /**
   * Exposes this question's answer controls so edits stay isolated from other questions.
   * @returns The editable answer controls belonging to this question.
   */
  get answers(): FormArray<FormControl<string>> {
    return this.controls.answers;
  }
  /** Adds an answer with the same required-text validation as the initial options. */
  addAnswer(): void {
    this.answers.push(createRequiredTextControl());
  }

  /**
   * Clears populated answers first; removes empty answers above the minimum of two.
   * @param index - Zero-based answer position to remove or clear.
   */
  removeAnswer(index: number): void {
    if (this.answers.length <= 2 || this.answers.at(index).value !== '') {
      this.answers.at(index).setValue('');
      return;
    }
    this.answers.removeAt(index);
  }

  /**
   * Erzeugt fortlaufende Buchstaben auch nach Z (AA, AB, ...).
   * @param index - Zero-based answer position.
   * @returns The alphabetical label starting with A and continuing with AA after Z.
   */
  answerLabel(index: number): string {
    let label: string = '';
    for (let number: number = index + 1; number > 0; number = Math.floor((number - 1) / ALPHABET_LENGTH)) {
      label = String.fromCharCode(FIRST_LETTER_CODE + (number - 1) % ALPHABET_LENGTH) + label;
    }
    return label;
  }

}

/** Creates a text control that rejects empty and whitespace-only values.
 * @returns A non-nullable control requiring at least one non-whitespace character.
 */
function createRequiredTextControl(): FormControl<string> {
  return new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/)],
  });
}