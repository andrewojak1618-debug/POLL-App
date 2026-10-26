import { Component, input } from '@angular/core';
import type { InputSignal } from '@angular/core';

/** Keeps submission feedback visible independently of the survey's scroll position. */
@Component({
  selector: 'app-completion-notice',
  templateUrl: './completion-notice.html',
  styleUrl: './completion-notice.scss',
})
export class CompletionNotice {
  readonly message: InputSignal<string> = input('');
}
