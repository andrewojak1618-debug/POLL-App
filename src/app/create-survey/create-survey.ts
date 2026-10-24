import type { CreateSurveyData } from '../shared/models/create_survey_data';
import type { RepositoryResult } from '../shared/data/repository_result';
import { SurveyStore } from '../shared/data/survey_store';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import type { AfterViewInit, Signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PrimaryButton } from '../shared/ui/primary-button/primary-button';
import { SurveyForm } from './survey-form/survey-form';

@Component({
  selector: 'app-create-survey',
  imports: [RouterLink, SurveyForm, PrimaryButton],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey implements AfterViewInit {
  private readonly router: Router = inject(Router);
  private readonly surveyForm = viewChild.required(SurveyForm);
  readonly store: SurveyStore = inject(SurveyStore);
  readonly saveResult = signal<RepositoryResult<string> | null>(null);

  /** Persists content, then resets and returns home only after confirmed success.
   * @param survey - Validated creation data from the form.
   */
  async saveSurvey(survey: CreateSurveyData): Promise<void> {
    if (this.store.isCreating() || this.store.isLoading()) return;
    this.saveResult.set(null);
    const result: RepositoryResult<string> = await this.store.createSurvey(survey);
    this.saveResult.set(result);
    if (!result.success) return;
    this.surveyForm().resetAfterSave();
    await this.router.navigate(['/'], { info: 'focus_home_heading' });
  }

  /** Loads categories even when opening the creation route directly. */
  constructor() { void this.store.load(); }

  private readonly heading: Signal<ElementRef<HTMLHeadingElement>> =
    viewChild.required<ElementRef<HTMLHeadingElement>>('surveyHeading');

  /** Places initial focus on the page heading after the view is ready. */
  ngAfterViewInit(): void {
    this.heading().nativeElement.focus({ preventScroll: true });
  }
}