import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import type { InputSignal, WritableSignal } from '@angular/core';
import type { FormControl } from '@angular/forms';

import type { SurveyCategoryData } from '../../shared/models/survey_category_data';

@Component({
  selector: 'app-category-picker',
  templateUrl: './category_picker.html',
  styleUrl: './category_picker.scss',
})
export class CategoryPicker {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  readonly categories: InputSignal<readonly SurveyCategoryData[]> = input.required<readonly SurveyCategoryData[]>();
  readonly control: InputSignal<FormControl<string>> = input.required<FormControl<string>>();
  readonly isOpen: WritableSignal<boolean> = signal(false);
  readonly invalid: InputSignal<boolean> = input(false);

  /** Returns the label associated with the selected category ID.
   * @returns Category name or the initial prompt.
   */
  selectedName(): string {
    return this.categories().find((category: SurveyCategoryData): boolean => category.id === this.control().value)?.name ?? 'Choose category';
  }

  /** Toggles the options without changing the selected value. */
  toggle(): void {
    this.isOpen.update((open: boolean): boolean => !open);
    if (!this.isOpen()) this.control().markAsTouched();
  }

  /** Commits the ID and returns focus to the trigger.
   * @param id - Selected category ID.
   * @param trigger - Button receiving focus after selection.
   */
  select(id: string, trigger: HTMLButtonElement): void {
    this.control().setValue(id);
    this.control().markAsDirty();
    this.close(trigger);
  }

  /** Closes the options and marks the control as visited.
   * @param trigger - Optional trigger to restore focus after Escape or selection.
   */
  close(trigger?: HTMLButtonElement): void {
    this.isOpen.set(false);
    this.control().markAsTouched();
    trigger?.focus();
  }

  /** Closes when keyboard focus leaves this component.
   * @param event - Focus transition to inspect.
   */
  onFocusOut(event: FocusEvent): void {
    if (!(event.relatedTarget instanceof Node) || !this.host.nativeElement.contains(event.relatedTarget)) this.close();
  }

  /** Dismisses an open menu on outside clicks.
   * @param event - Click target to inspect.
   */
  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent): void {
    if (this.isOpen() && event.target instanceof Node && !this.host.nativeElement.contains(event.target)) this.close();
  }
}
