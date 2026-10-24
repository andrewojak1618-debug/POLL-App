import { Component, ElementRef, inject, viewChild } from '@angular/core';
import type { AfterViewInit, Signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SurveyStore } from '../shared/data/survey_store';
import { SurveyList } from './survey_list/survey_list';
import { SurveyHighlights } from './survey_highlights/survey_highlights';
import { PrimaryButton } from '../shared/ui/primary_button/primary_button';

@Component({
  selector: 'app-home',
  imports: [PrimaryButton, SurveyHighlights, SurveyList, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit {
  readonly store: SurveyStore = inject(SurveyStore);
  /** Loads shared data for both the highlights and the survey lists. */
  constructor() { void this.store.load(); }

  private readonly focusHomeHeading: boolean =
    inject(Router).currentNavigation()?.extras.info === 'focus_home_heading' ||
    inject(Router).currentNavigation()?.trigger === 'popstate';
  private readonly homeHeading: Signal<ElementRef<HTMLHeadingElement>> =
    viewChild.required<ElementRef<HTMLHeadingElement>>('homeHeading');

  private readonly focusNewSurvey: boolean =
    inject(Router).currentNavigation()?.extras.info === 'focus_new_survey';
  private readonly newSurveyLink: Signal<ElementRef<HTMLAnchorElement>> =
    viewChild.required<unknown, ElementRef<HTMLAnchorElement>>('newSurveyLink', { read: ElementRef });


  /** Places focus on the requested return target after navigation. */
  ngAfterViewInit(): void {
    if (this.focusHomeHeading) {
      this.homeHeading().nativeElement.focus({ preventScroll: true });
    } else if (this.focusNewSurvey) {
      this.newSurveyLink().nativeElement.focus();
    }
  }

}
