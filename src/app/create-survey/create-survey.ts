import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SurveyForm } from './survey-form/survey-form';

@Component({
  selector: 'app-create-survey',
  imports: [RouterLink, SurveyForm],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey {}
