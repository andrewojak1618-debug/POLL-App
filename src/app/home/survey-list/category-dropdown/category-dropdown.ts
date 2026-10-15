import { Component, ElementRef, HostListener, inject, Input, output } from '@angular/core';
import type { CategorySelection } from './survey-categories';
import type { OutputEmitterRef } from '@angular/core';
import { SURVEY_CATEGORIES } from './survey-categories';

@Component({
  selector: 'app-category-dropdown',
  templateUrl: './category-dropdown.html',
  styleUrl: './category-dropdown.scss',
})
export class CategoryDropdown {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  readonly categories: readonly CategorySelection[] = SURVEY_CATEGORIES;
  isOpen: boolean = false;
  @Input() selectedCategory: CategorySelection = 'All Surveys';
  readonly selectedCategoryChange: OutputEmitterRef<CategorySelection> = output<CategorySelection>();

  /** Öffnet oder schließt die Kategorieauswahl. */
  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  /** Übernimmt die Kategorie und setzt den Fokus auf den Auslöser zurück. */
  select(category: CategorySelection, trigger: HTMLButtonElement): void {
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
