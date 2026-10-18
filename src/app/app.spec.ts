import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';

describe('App navigation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('should open Create Survey using New survey', async () => {
    const harness = await RouterTestingHarness.create('/');
    const button = harness.routeNativeElement?.querySelector<HTMLButtonElement>('[appPrimaryButton]');
    button?.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/create-survey');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Create new survey');
  });

  it('should return home using Cancel after opening the route directly', async () => {
    const harness = await RouterTestingHarness.create('/create-survey');
    const cancel = harness.routeNativeElement?.querySelector<HTMLAnchorElement>('.cancel_button');
    cancel?.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Collect Feedback,');
  });
});
