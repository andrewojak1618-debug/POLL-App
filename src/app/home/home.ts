import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import type { AfterViewInit, Signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { createSurveyExamples } from './survey-list/survey-examples';
import type { SurveyListItem } from './survey-list/survey-list-item';
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
  private readonly focusNewSurvey: boolean =
    inject(Router).currentNavigation()?.extras.info === 'focus_new_survey';
  private readonly newSurveyLink: Signal<ElementRef<HTMLAnchorElement>> =
    viewChild.required<unknown, ElementRef<HTMLAnchorElement>>('newSurveyLink', { read: ElementRef });

  readonly now: WritableSignal<number> = signal(Date.now());
  readonly surveys: readonly SurveyListItem[] = createSurveyExamples(this.now());

  /** Returns focus to the creation link after Cancel navigation. */
  ngAfterViewInit(): void {
    if (this.focusNewSurvey) {
      this.newSurveyLink().nativeElement.focus();
    }
  }

  /** Aktualisiert zeitabhängige Filter; die Subscription endet mit der Komponente. */
  constructor() {
    interval(1000).pipe(takeUntilDestroyed()).subscribe((): void => {
      this.now.set(Date.now());
    });
  }
}
