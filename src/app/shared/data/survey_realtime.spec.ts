import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';

import { SUPABASE_CLIENT } from './supabase_client';
import { SurveyRealtime } from './survey_realtime';
import type { SurveyInsertTable } from './survey_realtime';

@Component({ selector: 'app_realtime_consumer_test', standalone: true, template: '' })
class RealtimeConsumer {
  readonly realtime: SurveyRealtime = inject(SurveyRealtime);

  /** Starts the application channel from a component consumer. */
  constructor() {
    this.realtime.start();
  }
}
describe('SurveyRealtime inserts', (): void => {
  const callbacks: Map<string, (payload?: { new: unknown }) => void> = new Map();
  let reportStatus: (status: string, error?: Error) => void;
  const subscribe = vi.fn((callback: (status: string, error?: Error) => void): void => { reportStatus = callback; });
  const on = vi.fn((eventType: string, filter: { table: string; event: string }, callback: (payload?: { new: unknown }) => void): void => {
    callbacks.set(filter.event + ':' + filter.table, callback);
  });
  const teardown = vi.fn();
  const channel = { on, subscribe, teardown };
  const createChannel = vi.fn((): typeof channel => channel);
  const removeChannel = vi.fn();
  let realtime: SurveyRealtime;

  beforeEach((): void => {
    callbacks.clear();
    vi.clearAllMocks();
    removeChannel.mockResolvedValue('ok');
    TestBed.configureTestingModule({ imports: [RealtimeConsumer], providers: [provideRouter([
      { path: '', component: RealtimeConsumer },
      { path: 'surveys/:id', component: RealtimeConsumer },
    ]), { provide: SUPABASE_CLIENT,
      useValue: { channel: createChannel, removeChannel } }] });
    realtime = TestBed.inject(SurveyRealtime);
  });

  it('subscribes to exactly the three INSERT sources once across consumers', (): void => {
    realtime.start();
    TestBed.inject(SurveyRealtime).start();
    expect(createChannel).toHaveBeenCalledExactlyOnceWith('survey_changes');
    expect(subscribe).toHaveBeenCalledTimes(1);
    for (const table of ['surveys', 'survey_questions', 'survey_options']) {
      expect(on).toHaveBeenCalledWith('postgres_changes', { event: 'INSERT', schema: 'public', table }, expect.any(Function));
    }
    expect(on).toHaveBeenCalledWith('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'survey_options' }, expect.any(Function));
    expect(on).toHaveBeenCalledTimes(7);
  });

  it('requests a full refresh for deletions from every survey table', (): void => {
    const refresh = vi.fn();
    realtime.voteUpdates.subscribe(refresh);
    realtime.start();
    for (const table of ['surveys', 'survey_questions', 'survey_options']) {
      callbacks.get('DELETE:' + table)!();
    }
    expect(refresh).toHaveBeenCalledTimes(3);
    expect(refresh).toHaveBeenLastCalledWith(null);
  });

  it('forwards insert notifications from each table', (): void => {
    const received: SurveyInsertTable[] = [];
    realtime.inserts.subscribe((table: SurveyInsertTable): void => { received.push(table); });
    realtime.start();
    callbacks.forEach((callback: (payload?: { new: unknown }) => void): void => { callback({ new: {} }); });
    expect(received).toEqual(['surveys', 'survey_questions', 'survey_options']);
  });

  it('removes the channel and completes notifications on destruction', (): void => {
    const complete = vi.fn();
    const votesComplete = vi.fn();
    realtime.voteUpdates.subscribe({ complete: votesComplete });
    realtime.inserts.subscribe({ complete });
    realtime.start();
    TestBed.resetTestingModule();
    expect(removeChannel).toHaveBeenCalledExactlyOnceWith(channel);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(votesComplete).toHaveBeenCalledTimes(1);
    realtime.start();
    expect(createChannel).toHaveBeenCalledTimes(1);
  });

  it('does not open or remove an unused channel', (): void => {
    TestBed.resetTestingModule();
    expect(createChannel).not.toHaveBeenCalled();
    expect(removeChannel).not.toHaveBeenCalled();
  });

  it('reports option updates independently of inserts without requiring old row data', (): void => {
    const voteChanged = vi.fn();
    const inserted = vi.fn();
    realtime.voteUpdates.subscribe(voteChanged);
    realtime.inserts.subscribe(inserted);
    realtime.start();
    callbacks.get('UPDATE:survey_options')!({ new: {} });
    expect(voteChanged).toHaveBeenCalledTimes(1);
    expect(inserted).not.toHaveBeenCalled();
    callbacks.get('INSERT:survey_options')!();
    expect(voteChanged).toHaveBeenCalledTimes(1);
    expect(inserted).toHaveBeenCalledWith('survey_options');
  });

  it('does not forward late updates after destruction', (): void => {
    const voteChanged = vi.fn();
    realtime.voteUpdates.subscribe(voteChanged);
    realtime.start();
    const update = callbacks.get('UPDATE:survey_options')!;
    TestBed.resetTestingModule();
    update({ new: {} });
    expect(voteChanged).not.toHaveBeenCalled();
  });

  it('exposes idle, connecting and subscribed as read-only state', (): void => {
    expect(realtime.status()).toBe('idle');
    expect(realtime.error()).toBeNull();
    realtime.start();
    expect(realtime.status()).toBe('connecting');
    reportStatus('SUBSCRIBED');
    expect(realtime.status()).toBe('SUBSCRIBED');
    expect(realtime.error()).toBeNull();
  });

  it.each([['CHANNEL_ERROR', 'channel_error'], ['TIMED_OUT', 'timed_out'], ['CLOSED', 'closed']])(
    'exposes %s and clears its error when the SDK reconnects', (status: string, error: string): void => {
      realtime.start();
      reportStatus(status, new Error('internal connection details'));
      expect(realtime.status()).toBe(status);
      expect(realtime.error()).toBe(error);
      realtime.start();
      expect(createChannel).toHaveBeenCalledTimes(1);
      reportStatus('SUBSCRIBED');
      expect(realtime.error()).toBeNull();
    },
  );

  it('ignores late status callbacks after intentional destruction', (): void => {
    realtime.start();
    reportStatus('CHANNEL_ERROR');
    expect(realtime.error()).toBe('channel_error');
    TestBed.resetTestingModule();
    reportStatus('SUBSCRIBED');
    expect(realtime.status()).toBe('stopped');
    expect(realtime.error()).toBeNull();
  });

  it.each(['timed out', 'error'])('tears down local resources after removal returns %s', async (result: string): Promise<void> => {
    removeChannel.mockResolvedValue(result);
    realtime.start();
    TestBed.resetTestingModule();
    await Promise.resolve();
    expect(removeChannel).toHaveBeenCalledExactlyOnceWith(channel);
    expect(teardown).toHaveBeenCalledTimes(1);
    expect(realtime.status()).toBe('stopped');
    expect(realtime.error()).toBeNull();
  });

  it('handles a rejected channel removal and stops local resources', async (): Promise<void> => {
    removeChannel.mockRejectedValue(new Error('offline'));
    realtime.start();
    TestBed.resetTestingModule();
    await Promise.resolve();
    expect(teardown).toHaveBeenCalledTimes(1);
    reportStatus('TIMED_OUT');
    expect(realtime.status()).toBe('stopped');
  });

  it('leaves successful teardown to the SDK and cannot restart while removal is pending', async (): Promise<void> => {
    let finish!: (result: string) => void;
    removeChannel.mockReturnValue(new Promise<string>((resolve: (value: string | PromiseLike<string>) => void): void => { finish = resolve; }));
    realtime.start();
    TestBed.resetTestingModule();
    realtime.start();
    reportStatus('SUBSCRIBED');
    expect(createChannel).toHaveBeenCalledTimes(1);
    expect(realtime.status()).toBe('stopped');
    finish('ok');
    await Promise.resolve();
    expect(teardown).not.toHaveBeenCalled();
    expect(removeChannel).toHaveBeenCalledTimes(1);
  });

  it('keeps one channel while navigating repeatedly between routes', async (): Promise<void> => {
    const harness = await RouterTestingHarness.create();
    for (const path of ['/', '/surveys/first', '/', '/surveys/second', '/']) {
      const consumer = await harness.navigateByUrl(path, RealtimeConsumer);
      expect(consumer.realtime).toBe(realtime);
      expect(createChannel).toHaveBeenCalledExactlyOnceWith('survey_changes');
      expect(subscribe).toHaveBeenCalledTimes(1);
      expect(on).toHaveBeenCalledTimes(7);
      expect(removeChannel).not.toHaveBeenCalled();
    }
    TestBed.resetTestingModule();
    expect(removeChannel).toHaveBeenCalledExactlyOnceWith(channel);
  });
  it('shares one channel across component creation, destruction and recreation', async (): Promise<void> => {

    const first = TestBed.createComponent(RealtimeConsumer);
    const second = TestBed.createComponent(RealtimeConsumer);
    expect(first.componentInstance.realtime).toBe(second.componentInstance.realtime);
    expect(first.componentInstance.realtime).toBe(realtime);
    expect(createChannel).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(on).toHaveBeenCalledTimes(7);
    first.destroy();
    second.destroy();
    expect(removeChannel).not.toHaveBeenCalled();
    const replacement = TestBed.createComponent(RealtimeConsumer);
    expect(replacement.componentInstance.realtime).toBe(realtime);
    expect(createChannel).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(1);
    replacement.destroy();
    TestBed.resetTestingModule();
    await Promise.resolve();
    expect(removeChannel).toHaveBeenCalledExactlyOnceWith(channel);
  });
});
