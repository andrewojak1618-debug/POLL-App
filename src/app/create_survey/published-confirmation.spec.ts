import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { PublishedConfirmation } from './published_confirmation';

let fixture: ComponentFixture<PublishedConfirmation>;
beforeEach((): void => {
  vi.useFakeTimers();
  fixture = TestBed.createComponent(PublishedConfirmation);
  fixture.detectChanges();
});
afterEach((): void => {
  fixture.destroy();
  vi.useRealTimers();
});

it('keeps confirmation readable for eight seconds and emits once', (): void => {
  const closed = vi.fn();
  fixture.componentInstance.closed.subscribe(closed);
  fixture.componentInstance.show();
  vi.advanceTimersByTime(7999);
  expect(closed).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(closed).toHaveBeenCalledOnce();
});

it('cancels automatic closing after manual dismissal', (): void => {
  const closed = vi.fn();
  fixture.componentInstance.closed.subscribe(closed);
  fixture.componentInstance.show();
  (fixture.nativeElement as HTMLElement).querySelector('dialog')!.close();
  vi.advanceTimersByTime(8000);
  expect(closed).toHaveBeenCalledOnce();
});

it('clears the pending timer on destruction', (): void => {
  const closed = vi.fn();
  fixture.componentInstance.closed.subscribe(closed);
  fixture.componentInstance.show();
  fixture.destroy();
  vi.advanceTimersByTime(8000);
  expect(closed).not.toHaveBeenCalled();
});
