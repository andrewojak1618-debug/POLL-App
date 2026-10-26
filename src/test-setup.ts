import { beforeEach } from 'vitest';

/** Provides browser APIs absent in jsdom; real focus trapping is checked in the browser. */
HTMLDialogElement.prototype.showModal = function (): void { this.open = true; };
HTMLDialogElement.prototype.close = function (): void {
  this.open = false;
  this.dispatchEvent(new Event('close'));
};
beforeEach((): void => localStorage.clear());
