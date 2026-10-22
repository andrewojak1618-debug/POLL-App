import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

export class SurveyQuestion extends FormGroup<{
  question: FormControl<string>;
  multipleAnswers: FormControl<boolean>;
  answers: FormArray<FormControl<string>>;
}> {
  /** Erstellt eine Frage mit zwei unabhängigen Antwortfeldern. */
  constructor() {
    super({
      question: createRequiredTextControl(),
      multipleAnswers: new FormControl(false, { nonNullable: true }),
      answers: new FormArray([
        createRequiredTextControl(),
        createRequiredTextControl(),
      ], [Validators.required, Validators.minLength(2)]),
    });
  }

  /** Liefert die Antworten dieser Frage. */
  get answers(): FormArray<FormControl<string>> {
    return this.controls.answers;
  }
  /** Ergänzt eine leere Antwortmöglichkeit. */
  addAnswer(): void {
    this.answers.push(createRequiredTextControl());
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