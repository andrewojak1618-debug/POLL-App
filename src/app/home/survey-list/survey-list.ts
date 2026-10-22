import type { Signal } from '@angular/core';
import { SurveyStore } from '../../shared/data/survey_store';
import { Component, computed, inject } from '@angular/core';

import { HomeFilterState } from './home_filter_state';
import { CategoryDropdown } from './category-dropdown/category-dropdown';
import { FilterButton } from '../../shared/ui/filter-button/filter-button';
import { SurveyListCard } from './survey-list-card/survey-list-card';

import type { SurveyDetail } from '../../shared/models/survey_detail';

@Component({
  selector: 'app-survey-list',
  imports: [FilterButton, SurveyListCard, CategoryDropdown],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
})
export class SurveyList {
  readonly store: SurveyStore = inject(SurveyStore);

  /** Loads surveys and categories through the existing shared store. */
  constructor() { void this.store.load(); }

  readonly filters: HomeFilterState = inject(HomeFilterState);
  readonly selectedCategoryId: Signal<string | null> = computed((): string | null =>
    this.filters.status() === 'active' ? this.store.activeCategoryId() : this.store.pastCategoryId());

  /** Updates only the category belonging to the visible status.
   * @param categoryId - Selected category ID, or null for all categories.
   */
  selectCategory(categoryId: string | null): void {
    if (this.filters.status() === 'active') this.store.selectActiveCategory(categoryId);
    else this.store.selectPastCategory(categoryId);
  }

  readonly visibleSurveys: Signal<readonly SurveyDetail[]> = computed((): readonly SurveyDetail[] =>
    this.filters.status() === 'active' ? this.store.filteredActiveSurveys() : this.store.filteredPastSurveys());
}