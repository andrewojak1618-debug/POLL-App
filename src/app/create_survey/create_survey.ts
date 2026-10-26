import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import type { AfterViewInit, OnDestroy, Signal, WritableSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import type { CreateSurveyData } from '../shared/models/create_survey_data';
import type { RepositoryResult } from '../shared/data/repository_result';
import { SurveyStore } from '../shared/data/survey_store';
import { PrimaryButton } from '../shared/ui/primary_button/primary_button';
import { SurveyForm } from './survey_form/survey_form';
import { Home } from '../home/home';
import { SurveyScrollArea } from '../home/survey_list/survey_scroll_area/survey_scroll_area';
import { PublishedConfirmation } from './published_confirmation';

@Component({
  selector: 'app-create-survey',
  imports: [RouterLink, SurveyForm, PrimaryButton, PublishedConfirmation, Home, SurveyScrollArea],
  templateUrl: './create_survey.html',
  styleUrl: './create_survey.scss',
})
export class CreateSurvey implements AfterViewInit, OnDestroy {
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly router: Router = inject(Router);
  readonly store: SurveyStore = inject(SurveyStore);
  readonly saveResult: WritableSignal<RepositoryResult<string> | null> = signal<RepositoryResult<string> | null>(null);

  private readonly publishedDialog: Signal<PublishedConfirmation> = viewChild.required(PublishedConfirmation);

  /** Persists content and shows confirmation only after confirmed success.
   * @param survey - Validated creation data from the form.
   */
  async saveSurvey(survey: CreateSurveyData): Promise<void> {
    if (this.store.isCreating() || this.store.isLoading() || this.saveResult()?.success) return;
    this.saveResult.set(null);
    const result: RepositoryResult<string> = await this.store.createSurvey(survey);
    if (this.destroyRef.destroyed) return;
    this.saveResult.set(result);
    if (!result.success) return;
    this.publishedDialog().show();
  }

  /** Opens the saved survey after the user dismisses the confirmation. */
  async openPublishedSurvey(): Promise<void> {
    const result: RepositoryResult<string> | null = this.saveResult();
    if (!result?.success) return;
    await this.router.navigate(['/surveys', result.data]);
  }


  private readonly dialog: Signal<ElementRef<HTMLDialogElement>> = viewChild.required('createDialog');
  private readonly previousOverflow: string = document.body.style.overflow;

  /** Restores page scrolling when the creation route is left. */
  ngOnDestroy(): void {
    document.body.style.overflow = this.previousOverflow;
  }

  /** Cancels creation and restores focus on the Home action.
   * @param event - Native cancel event whose default closing is handled by routing.
   */
  cancelCreation(event: Event): void {
    event.preventDefault();
    if (!this.store.isCreating()) void this.router.navigate(['/'], { info: 'focus_new_survey' });
  }

  private readonly heading: Signal<ElementRef<HTMLHeadingElement>> =
    viewChild.required<ElementRef<HTMLHeadingElement>>('surveyHeading');

  /** Focuses the heading to make the new route apparent to keyboard and screen-reader users. */
  ngAfterViewInit(): void {
    this.dialog().nativeElement.showModal();
    document.body.style.overflow = 'hidden';
    this.heading().nativeElement.focus({ preventScroll: true });
  }
}