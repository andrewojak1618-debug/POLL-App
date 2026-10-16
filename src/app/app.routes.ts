import { Routes } from '@angular/router';
import { Home } from './home/home';
import { CreateSurvey } from './create-survey/create-survey';

export const routes: Routes = [
  { path: '', component: Home, title: 'Poll App' },
  { path: 'create-survey', component: CreateSurvey, title: 'Create Survey | Poll App' },
  { path: '**', redirectTo: '' },
];
