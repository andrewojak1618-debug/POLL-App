import { Component, ElementRef, HostListener, inject, Input, output } from '@angular/core';
import type { SurveyCategoryData } from '../../../shared/models/survey_category_data';
import type { OutputEmitterRef } from '@angular/core';


@Component({
  selector: 'app-category-dropdown',
  templateUrl: './category-dropdown.html',
  styleUrl: './category-dropdown.scss',
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

  /** Öffnet oder schließt die Kategorieauswahl. */
  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  /** Übernimmt die Kategorie und setzt den Fokus auf den Auslöser zurück. */
  select(category: string | null, trigger: HTMLButtonElement): void {
    this.selectedCategoryChange.emit(category);
    this.close(trigger);
  }

  /** Schließt die Auswahl und stellt den Tastaturfokus wieder her. */
  close(trigger: HTMLButtonElement): void {
    this.isOpen = false;
    trigger.focus();
  }

  /** Schließt das Menü bei einem Klick außerhalb der Komponente. */
  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent): void {
    if (event.target instanceof Node && !this.host.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  /** Schließt das Menü, wenn der Tastaturfokus die Komponente verlässt. */
  onFocusOut(event: FocusEvent): void {
    if (!(event.relatedTarget instanceof Node) || !this.host.nativeElement.contains(event.relatedTarget)) {
      this.isOpen = false;
    }
  }
}
