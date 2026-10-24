import { Component, ElementRef, HostListener, inject, Input, output } from '@angular/core';
import type { OutputEmitterRef } from '@angular/core';

import type { SurveyCategoryData } from '../../../shared/models/survey_category_data';


@Component({
  selector: 'app-category-dropdown',
  templateUrl: './category_dropdown.html',
  styleUrl: './category_dropdown.scss',
})
export class CategoryDropdown {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  @Input({ required: true }) categories: readonly SurveyCategoryData[] = [];
  isOpen: boolean = false;
  @Input() selectedCategory: string | null = null;
  readonly selectedCategoryChange: OutputEmitterRef<string | null> = output<string | null>();

  /** Returns the loaded name for the selected category ID.
   * @returns Display name, or an empty string when the category is unavailable.
   */
  get selectedCategoryName(): string {
    return this.categories.find((category: SurveyCategoryData): boolean => category.id === this.selectedCategory)?.name ?? '';
  }

  /** Changes menu visibility without committing a different category selection. */
  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  /**
   * Übernimmt die Kategorie und setzt den Fokus auf den Auslöser zurück.
   * @param category - Selected category ID, or null for all categories.
   * @param trigger - Dropdown button that receives focus after selection.
   */
  select(category: string | null, trigger: HTMLButtonElement): void {
    this.selectedCategoryChange.emit(category);
    this.close(trigger);
  }

  /**
   * Schließt die Auswahl und stellt den Tastaturfokus wieder her.
   * @param trigger - Dropdown button that receives focus after closing.
   */
  close(trigger: HTMLButtonElement): void {
    this.isOpen = false;
    trigger.focus();
  }

  /**
   * Schließt das Menü bei einem Klick außerhalb der Komponente.
   * @param event - Document click used to determine whether the target is outside.
   */
  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent): void {
    if (event.target instanceof Node && !this.host.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  /**
   * Schließt das Menü, wenn der Tastaturfokus die Komponente verlässt.
   * @param event - Focus event whose related target identifies the next focused element.
   */
  onFocusOut(event: FocusEvent): void {
    if (!(event.relatedTarget instanceof Node) || !this.host.nativeElement.contains(event.relatedTarget)) {
      this.isOpen = false;
    }
  }
}
