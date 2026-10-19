import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';

/** Activates a visible control and waits for Angular to finish navigation. */
async function activate(harness: RouterTestingHarness, selector: string): Promise<void> {
  const control: HTMLElement | null | undefined = harness.routeNativeElement?.querySelector(selector);
  expect(control).toBeTruthy();
  control?.click();
  harness.detectChanges();
  await harness.fixture.whenStable();
}

/** Selects a status and category through the rendered Home controls. */
async function selectFilters(harness: RouterTestingHarness): Promise<void> {
  await activate(harness, '[appFilterButton]:nth-child(2)');
  await activate(harness, '.category_trigger');
  await activate(harness, '.category_option:nth-child(2)');
}

describe('Home filters across navigation', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter(routes)] }));

  it('preserves status, category and results after Cancel', async () => {
    const harness = await RouterTestingHarness.create('/');
    await selectFilters(harness);
    const results: string | null | undefined = harness.routeNativeElement?.querySelector('.survey_grid')?.textContent;
    const category: string | null | undefined = harness.routeNativeElement?.querySelector('.selected_category')?.textContent;
    await activate(harness, 'a[appPrimaryButton]');
    await activate(harness, '.cancel_button');
    expect(harness.routeNativeElement?.querySelector('[appFilterButton]:nth-child(2)')?.getAttribute('aria-pressed')).toBe('true');
    expect(harness.routeNativeElement?.querySelector('.selected_category')?.textContent).toBe(category);
    expect(harness.routeNativeElement?.querySelector('.survey_grid')?.textContent).toBe(results);
  });

  it('preserves filters when Home is recreated through route navigation', async () => {
    const harness = await RouterTestingHarness.create('/');
    await selectFilters(harness);
    const category: string | null | undefined = harness.routeNativeElement?.querySelector('.selected_category')?.textContent;
    await harness.navigateByUrl('/create-survey');
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement?.querySelector('[appFilterButton]:nth-child(2)')?.getAttribute('aria-pressed')).toBe('true');
    expect(harness.routeNativeElement?.querySelector('.selected_category')?.textContent).toBe(category);
  });
});