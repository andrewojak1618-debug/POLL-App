import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';

@Component({
  selector: 'app-survey-scroll-area',
  templateUrl: './survey_scroll_area.html',
  styleUrl: './survey_scroll_area.scss',
})
export class SurveyScrollArea {
  private readonly viewport: Signal<ElementRef<HTMLElement>> = viewChild.required('viewport');
  private readonly content: Signal<ElementRef<HTMLElement>> = viewChild.required('content');
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  readonly maximum: WritableSignal<number> = signal(0);
  readonly position: WritableSignal<number> = signal(0);

  /** Registers scrolling updates and releases observers when the view is destroyed. */
  constructor() {
    afterNextRender((): void => this.observeSize());
  }

  /** Keeps the grip synchronized when filtering or resizing changes the content. */
  private observeSize(): void {
    if (typeof ResizeObserver === 'undefined') return;
    const observer: ResizeObserver = new ResizeObserver((): void => this.updateScroll());
    observer.observe(this.viewport().nativeElement);
    observer.observe(this.content().nativeElement);
    this.destroyRef.onDestroy((): void => observer.disconnect());
    this.updateScroll();
  }

  /** Reads native scrolling so wheel, touch and keyboard movement share one position. */
  updateScroll(): void {
    const viewport: HTMLElement = this.viewport().nativeElement;
    this.maximum.set(Math.max(0, viewport.scrollHeight - viewport.clientHeight));
    this.position.set(viewport.scrollTop);
  }

  /** Moves the native viewport from the grip's pointer or keyboard input.
   * @param value - Vertical scroll offset selected by the range control.
   */
  scrollTo(value: string): void {
    this.viewport().nativeElement.scrollTop = Number(value);
    this.updateScroll();
  }
}
