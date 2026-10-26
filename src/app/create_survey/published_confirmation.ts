import { Component, ElementRef, output, viewChild } from '@angular/core';
import type { OutputEmitterRef, Signal } from '@angular/core';

@Component({
  selector: 'app-published-confirmation',
  templateUrl: './published_confirmation.html',
  styleUrl: './published_confirmation.scss',
})
export class PublishedConfirmation {
  private readonly dialog: Signal<ElementRef<HTMLDialogElement>> = viewChild.required('dialog');
  readonly closed: OutputEmitterRef<void> = output<void>();

  /** Opens the native modal and lets the browser manage focus and its backdrop. */
  show(): void {
    this.dialog().nativeElement.showModal();
  }
}
