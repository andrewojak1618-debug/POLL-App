import { Component, ElementRef, viewChild } from '@angular/core';
import type { AfterViewInit, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SurveyForm } from './survey-form/survey-form';

@Component({
  selector: 'app-create-survey',
  imports: [RouterLink, SurveyForm],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey implements AfterViewInit {
  private readonly heading: Signal<ElementRef<HTMLHeadingElement>> =
    viewChild.required<ElementRef<HTMLHeadingElement>>('surveyHeading');

  /** Places initial focus on the page heading after the view is ready. */
  ngAfterViewInit(): void {
    this.heading().nativeElement.focus({ preventScroll: true });
  }
}