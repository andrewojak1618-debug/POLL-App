import { Component, DestroyRef, ElementRef, inject, output, viewChild } from '@angular/core';
import type { OutputEmitterRef, Signal } from '@angular/core';

const CONFIRMATION_DURATION_MS: number = 8000;

@Component({
  selector: 'app-published-confirmation',
  templateUrl: './published_confirmation.html',
  styleUrl: './published_confirmation.scss',
})
export class PublishedConfirmation {
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** Cancels pending navigation when the dialog component is destroyed. */
  constructor() {
    inject(DestroyRef).onDestroy((): void => clearTimeout(this.timer));
  }
  private readonly dialog: Signal<ElementRef<HTMLDialogElement>> = viewChild.required('dialog');
  readonly closed: OutputEmitterRef<void> = output<void>();

  /** Opens the native modal and lets the browser manage focus and its backdrop. */
  show(): void {
    clearTimeout(this.timer);
    this.dialog().nativeElement.showModal();
    this.timer = setTimeout((): void => this.dialog().nativeElement.close(), CONFIRMATION_DURATION_MS);
  }
  /** Stops the timer and opens the published survey once the dialog closes. */
  finish(): void {
    clearTimeout(this.timer);
    this.closed.emit();
  }
}
