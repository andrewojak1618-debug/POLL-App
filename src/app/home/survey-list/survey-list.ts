import { Component, Input } from '@angular/core';
import { filterSurveysByCategory } from './survey-category';
import type { CategorySelection } from './category-dropdown/survey-categories';
import { CategoryDropdown } from './category-dropdown/category-dropdown';
import { FilterButton } from '../../shared/ui/filter-button/filter-button';
import { SurveyListCard } from './survey-list-card/survey-list-card';

import { filterSurveysByStatus } from './survey-status';
import type { SurveyStatus } from './survey-status';
import type { SurveyListItem } from './survey-list-item';

@Component({
  selector: 'app-survey-list',
  imports: [FilterButton, SurveyListCard, CategoryDropdown],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
})
export class SurveyList {
  selectedStatus: SurveyStatus = 'active';
  selectedCategory: CategorySelection = 'All Surveys';
  @Input({ required: true }) surveys: readonly SurveyListItem[] = [];
  @Input({ required: true }) now: number = 0;

  /** Liefert die zum ausgewählten Status und zur Kategorie passenden Umfragen. */
  get visibleSurveys(): readonly SurveyListItem[] {
    const statusMatches: readonly SurveyListItem[] = filterSurveysByStatus(this.surveys, this.selectedStatus, this.now);
    return filterSurveysByCategory(statusMatches, this.selectedCategory);
  }
}
