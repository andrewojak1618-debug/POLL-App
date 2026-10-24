import type { AbstractControl } from '@angular/forms';

/** Shows validation feedback only after editing or leaving a field.
 * @param control - Form control whose validation state is inspected.
 * @returns Whether an invalid control has been interacted with or marked touched on submit.
 */
export function showFieldError(control: AbstractControl): boolean {
  return control.invalid && (control.dirty || control.touched);
}