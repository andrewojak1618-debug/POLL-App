import type { Routes } from '@angular/router';

import { Home } from './home/home';
import { CreateSurvey } from './create_survey/create_survey';
import { SurveyDetail } from './surveys/detail/survey_detail';

export const routes: Routes = [
  { path: '', component: Home, title: 'Poll App' },
  { path: 'create-survey', component: CreateSurvey, title: 'Create Survey | Poll App' },
  { path: 'surveys/:id', component: SurveyDetail, title: 'Survey details | Poll App' },
  { path: '**', redirectTo: '' },
];
