import { SurveyRealtime } from './shared/data/survey_realtime';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly realtime: SurveyRealtime = inject(SurveyRealtime);
}
