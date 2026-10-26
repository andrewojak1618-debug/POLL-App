import type { Signal, WritableSignal } from '@angular/core';
import { Component, computed, inject, signal } from '@angular/core';

import { SurveyStore } from '../../shared/data/survey_store';
import { HomeFilterState } from './home_filter_state';
import { CategoryDropdown } from './category_dropdown/category_dropdown';
import { FilterButton } from '../../shared/ui/filter_button/filter_button';
import { SurveyScrollArea } from './survey_scroll_area/survey_scroll_area';
import { SurveyListCard } from './survey_list_card/survey_list_card';
import type { SurveyDetail } from '../../shared/models/survey_detail';

@Component({
  selector: 'app-survey-list',
  imports: [FilterButton, SurveyListCard, CategoryDropdown, SurveyScrollArea],
  templateUrl: './survey_list.html',
  styleUrl: './survey_list.scss',
})
export class SurveyList {
  readonly previewCategoryId: WritableSignal<string | null> = signal(null);
  readonly store: SurveyStore = inject(SurveyStore);


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