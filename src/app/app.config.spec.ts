import { LocationStrategy } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { appConfig } from './app.config';

/** Verifies that shared links stay on the static host's index document. */
describe('Static hosting routes', (): void => {
  it('generates direct survey links without requesting a server subdirectory', (): void => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    const location: LocationStrategy = TestBed.inject(LocationStrategy);
    expect(location.prepareExternalUrl('/surveys/example-id')).toBe('#/surveys/example-id');
    expect(location.prepareExternalUrl('/create-survey')).toBe('#/create-survey');
  });
});