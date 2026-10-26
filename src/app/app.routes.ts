import type { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Poll App', loadComponent: async (): Promise<typeof import('./home/home').Home> =>
    (await import('./home/home')).Home },
  { path: 'create-survey', title: 'Create Survey | Poll App',
    loadComponent: async (): Promise<typeof import('./create_survey/create_survey').CreateSurvey> =>
      (await import('./create_survey/create_survey')).CreateSurvey },
  { path: 'surveys/:id', title: 'Survey details | Poll App',
    loadComponent: async (): Promise<typeof import('./surveys/detail/survey_detail').SurveyDetail> =>
      (await import('./surveys/detail/survey_detail')).SurveyDetail },
  { path: '**', redirectTo: '' },
];
