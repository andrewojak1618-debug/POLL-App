import { EMPTY } from 'rxjs';
import { computed } from '@angular/core';
import type { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SurveyRealtime } from './survey_realtime';
import { SurveyRepository } from './survey_repository';
import { SurveyStore } from './survey_store';

const START: number = Date.parse('2026-10-21T10:00:00Z');

describe('SurveyStore current time', (): void => {
  let store: SurveyStore;

  beforeEach((): void => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    TestBed.configureTestingModule({ providers: [{ provide: SurveyRealtime, useValue: { inserts: EMPTY, voteUpdates: EMPTY, start: (): void => {} } }, { provide: SurveyRepository, useValue: {} }] });
    store = TestBed.inject(SurveyStore);
  });

  afterEach((): void => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('provides the current instant immediately and refreshes each second', (): void => {
    const elapsed: Signal<number> = computed((): number => store.now() - START);
    expect(elapsed()).toBe(0);
    vi.advanceTimersByTime(999);
    expect(elapsed()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(elapsed()).toBe(1000);
    vi.advanceTimersByTime(2000);
    expect(elapsed()).toBe(3000);
  });

  it('reads wall-clock time rather than counting timer ticks', (): void => {
    vi.setSystemTime(START + 60000);
    vi.advanceTimersByTime(1000);
    expect(store.now()).toBe(START + 61000);
  });

  it('stops the timer when the store injector is destroyed', (): void => {
    expect(vi.getTimerCount()).toBe(1);
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(store.now()).toBe(START);
  });
});
