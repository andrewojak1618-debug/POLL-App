import { SurveyStore } from '../shared/data/survey_store';
import { Component, ElementRef, inject, viewChild } from '@angular/core';
import type { AfterViewInit, Signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SurveyList } from './survey-list/survey-list';
import { SurveyHighlights } from './survey-highlights/survey-highlights';
import { PrimaryButton } from '../shared/ui/primary-button/primary-button';

@Component({
  selector: 'app-home',
  imports: [PrimaryButton, SurveyHighlights, SurveyList, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit {
  /** Loads shared data for both the highlights and the survey lists. */
  constructor() { void inject(SurveyStore).load(); }

  private readonly focusNewSurvey: boolean =
    inject(Router).currentNavigation()?.extras.info === 'focus_new_survey';
  private readonly newSurveyLink: Signal<ElementRef<HTMLAnchorElement>> =
    viewChild.required<unknown, ElementRef<HTMLAnchorElement>>('newSurveyLink', { read: ElementRef });


  /** Returns focus to the creation link after Cancel navigation. */
  ngAfterViewInit(): void {
    if (this.focusNewSurvey) {
      this.newSurveyLink().nativeElement.focus();
    }
  }

}
