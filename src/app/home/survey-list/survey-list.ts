import { Component, inject, Input } from '@angular/core';
import { filterSurveysByCategory } from './survey-category';
import { HomeFilterState } from './home_filter_state';
import { CategoryDropdown } from './category-dropdown/category-dropdown';
import { FilterButton } from '../../shared/ui/filter-button/filter-button';
import { SurveyListCard } from './survey-list-card/survey-list-card';

import { filterSurveysByStatus } from './survey-status';

import type { SurveyListItem } from './survey-list-item';

@Component({
  selector: 'app-survey-list',
  imports: [FilterButton, SurveyListCard, CategoryDropdown],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
})
export class SurveyList {
  readonly filters: HomeFilterState = inject(HomeFilterState);
  @Input({ required: true }) surveys: readonly SurveyListItem[] = [];
  @Input({ required: true }) now: number = 0;

  /** Liefert die zum ausgewählten Status und zur Kategorie passenden Umfragen. */
  get visibleSurveys(): readonly SurveyListItem[] {
    const statusMatches: readonly SurveyListItem[] = filterSurveysByStatus(this.surveys, this.filters.status(), this.now);
    return filterSurveysByCategory(statusMatches, this.filters.category());
  }
}
