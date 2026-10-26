import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';

import { CategoryPicker } from './category_picker';

it('preserves required validation and restores focus after selection and Escape', (): void => {
  const fixture = TestBed.createComponent(CategoryPicker);
  const control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  fixture.componentRef.setInput('control', control);
  fixture.componentRef.setInput('categories', [{ id: 'team', name: 'Team Activities', slug: 'team' }]);
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  const trigger: HTMLButtonElement = root.querySelector<HTMLButtonElement>('button')!;
  expect(control.invalid).toBe(true);
  trigger.click();
  fixture.detectChanges();
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  root.querySelector<HTMLButtonElement>('.category_options button')!.click();
  fixture.detectChanges();
  expect(control.value).toBe('team');
  expect(control.valid).toBe(true);
  expect(control.touched).toBe(true);
  expect(control.dirty).toBe(true);
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  trigger.click();
  fixture.detectChanges();
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  fixture.detectChanges();
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  expect(control.value).toBe('team');
});
