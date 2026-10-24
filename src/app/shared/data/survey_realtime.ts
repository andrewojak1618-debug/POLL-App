import type { Signal, WritableSignal } from '@angular/core';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import type { RealtimeChannel, RealtimePostgresUpdatePayload, SupabaseClient } from '@supabase/supabase-js';
import { Subject } from 'rxjs';
import type { Observable } from 'rxjs';

import type { SurveyOption } from '../models/survey_option';
import { mapOption } from './survey_rows';
import { SUPABASE_CLIENT } from './supabase_client';

export type SurveyInsertTable = 'surveys' | 'survey_questions' | 'survey_options';

type ChannelStatus = Parameters<NonNullable<Parameters<RealtimeChannel['subscribe']>[0]>>[0];
export type SurveyRealtimeStatus = 'idle' | 'connecting' | 'stopped' | ChannelStatus;
export type SurveyRealtimeError = 'channel_error' | 'timed_out' | 'closed';

/** Owns one shared channel and exposes insert and vote-update notifications without modifying data. */
@Injectable({ providedIn: 'root' })
export class SurveyRealtime {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);
  private readonly insertEvents: Subject<SurveyInsertTable> = new Subject<SurveyInsertTable>();
  private readonly voteEvents: Subject<SurveyOption | null> = new Subject<SurveyOption | null>();
  private readonly statusState: WritableSignal<SurveyRealtimeStatus> = signal<SurveyRealtimeStatus>('idle');
  readonly status: Signal<SurveyRealtimeStatus> = this.statusState.asReadonly();
  readonly error: Signal<SurveyRealtimeError | null> = computed((): SurveyRealtimeError | null => {
    switch (this.status()) {
      case 'CHANNEL_ERROR': return 'channel_error';
      case 'TIMED_OUT': return 'timed_out';
      case 'CLOSED': return 'closed';
      default: return null;
    }
  });
  private channel: RealtimeChannel | null = null;
  private destroyed: boolean = false;

  readonly inserts: Observable<SurveyInsertTable> = this.insertEvents.asObservable();

  readonly voteUpdates: Observable<SurveyOption | null> = this.voteEvents.asObservable();

  /** Releases the shared channel when its application injector is destroyed. */
  constructor() {
    inject(DestroyRef).onDestroy((): void => {
      this.destroyed = true;
      this.statusState.set('stopped');
      this.insertEvents.complete();
      this.voteEvents.complete();
      if (this.channel) void this.releaseChannel(this.channel);
      this.channel = null;
    });
  }

  /** Subscribes once to survey inserts and answer-option updates. */
  start(): void {
    if (this.channel || this.destroyed) return;
    this.statusState.set('connecting');
    this.channel = this.supabase.channel('survey_changes');
    const tables: readonly SurveyInsertTable[] = ['surveys', 'survey_questions', 'survey_options'];
    for (const table of tables) {
      this.channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (): void => {
        this.insertEvents.next(table);
      });
    }
    this.subscribeToVotes(this.channel);
    this.channel.subscribe((status: ChannelStatus): void => {
      if (!this.destroyed) this.statusState.set(status);
    });
  }

  /**
   * Notifies consumers when option updates may change vote counts.
   * Old vote counts are not required; consumers can reload authoritative data.
   * @param channel - The shared channel configured before subscription.
   */
  private subscribeToVotes(channel: RealtimeChannel): void {
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'survey_options' }, (payload: RealtimePostgresUpdatePayload<Record<string, unknown>>): void => {
      this.emitVoteUpdate(payload.new);
    });
  }

  /**
   * Validates new option data; unknown payloads request a safe full refresh.
   * @param row - The new database row, without requiring old-row values.
   */
  private emitVoteUpdate(row: unknown): void {
    try {
      this.voteEvents.next(mapOption(row));
    } catch {
      this.voteEvents.next(null);
    }
  }

  /**
   * Removes the owned channel and stops local resources if leaving fails.
   * @param channel - Only the channel owned by this service.
   */
  private async releaseChannel(channel: RealtimeChannel): Promise<void> {
    try {
      const result: string = await this.supabase.removeChannel(channel);
      if (result !== 'ok') channel.teardown();
    } catch {
      channel.teardown();
    }
  }
}
