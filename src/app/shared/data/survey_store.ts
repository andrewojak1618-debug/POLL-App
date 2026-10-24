import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { auditTime, interval, merge, tap } from 'rxjs';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';

import type { SurveyOption } from '../models/survey_option';
import { SurveyRealtime } from './survey_realtime';
import type { CreateSurveyData } from '../models/create_survey_data';
import { getEndingSoonSurveys } from './ending_soon';
import { filterSurveysByStatus } from './survey_status';
import { SurveyRepository } from './survey_repository';
import type { SurveyDetail, SurveyQuestionDetail } from '../models/survey_detail';
import type { SurveyCategoryData } from '../models/survey_category_data';
import { REPOSITORY_ERROR } from './repository_result';
import type { RepositoryError, RepositoryResult } from './repository_result';

const REALTIME_BATCH_WINDOW_MS: number = 50;
const CLOCK_UPDATE_INTERVAL_MS: number = 1000;

/** Owns shared survey state and exposes read-only signals to consumers. */
@Injectable({ providedIn: 'root' })
export class SurveyStore {
  private readonly realtime: SurveyRealtime = inject(SurveyRealtime);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly pendingOptions: Map<string, SurveyOption> = new Map();
  private unknownChange: boolean = false;
  private reloadRequested: boolean = false;
  private readonly repository: SurveyRepository = inject(SurveyRepository);
  private readonly surveyState: WritableSignal<readonly SurveyDetail[]> = signal<readonly SurveyDetail[]>([]);
  private readonly categoryState: WritableSignal<readonly SurveyCategoryData[]> = signal<readonly SurveyCategoryData[]>([]);
  private readonly activeCategoryState: WritableSignal<string | null> = signal<string | null>(null);
  private readonly pastCategoryState: WritableSignal<string | null> = signal<string | null>(null);
  private readonly currentTimeState: WritableSignal<number> = signal(Date.now());
  private pendingLoad: Promise<void> | null = null;
  private pendingVote: Promise<RepositoryResult<void>> | null = null;
  private readonly votingState: WritableSignal<boolean> = signal(false);
  private pendingCreation: Promise<RepositoryResult<string>> | null = null;
  private readonly creatingState: WritableSignal<boolean> = signal(false);
  private readonly loadingState: WritableSignal<boolean> = signal(false);
  private readonly errorState: WritableSignal<RepositoryError | null> = signal<RepositoryError | null>(null);

  readonly surveys: Signal<readonly SurveyDetail[]> = this.surveyState.asReadonly();
  readonly categories: Signal<readonly SurveyCategoryData[]> = this.categoryState.asReadonly();
  readonly activeCategoryId: Signal<string | null> = this.activeCategoryState.asReadonly();
  readonly pastCategoryId: Signal<string | null> = this.pastCategoryState.asReadonly();
  readonly now: Signal<number> = this.currentTimeState.asReadonly();
  readonly isVoting: Signal<boolean> = this.votingState.asReadonly();
  readonly isCreating: Signal<boolean> = this.creatingState.asReadonly();
  readonly isLoading: Signal<boolean> = this.loadingState.asReadonly();
  readonly error: Signal<RepositoryError | null> = this.errorState.asReadonly();

  readonly activeSurveys: Signal<readonly SurveyDetail[]> = computed((): readonly SurveyDetail[] =>
    filterSurveysByStatus(this.surveys(), 'active', this.now()));

  readonly pastSurveys: Signal<readonly SurveyDetail[]> = computed((): readonly SurveyDetail[] =>
    filterSurveysByStatus(this.surveys(), 'past', this.now()));

  readonly endingSoonSurveys: Signal<readonly SurveyDetail[]> = computed((): readonly SurveyDetail[] =>
    getEndingSoonSurveys(this.surveys(), this.now()));

  readonly filteredActiveSurveys: Signal<readonly SurveyDetail[]> = computed((): readonly SurveyDetail[] =>
    this.filterByCategory(this.activeSurveys(), this.activeCategoryId()));

  readonly filteredPastSurveys: Signal<readonly SurveyDetail[]> = computed((): readonly SurveyDetail[] =>
    this.filterByCategory(this.pastSurveys(), this.pastCategoryId()));
  /** Keeps deadline-derived lists current and batches Realtime refreshes; both subscriptions end with the store. */
  constructor() {
    merge(
      this.realtime.inserts.pipe(tap((): void => { this.unknownChange = true; })),
      this.realtime.voteUpdates.pipe(tap((option: SurveyOption | null): void => this.queueOption(option))),
    ).pipe(
      auditTime(REALTIME_BATCH_WINDOW_MS), takeUntilDestroyed(),
    ).subscribe((): void => {
      this.refreshRealtime();
    });
    interval(CLOCK_UPDATE_INTERVAL_MS).pipe(takeUntilDestroyed()).subscribe((): void => {
      this.currentTimeState.set(Date.now());
    });
  }
  /**
   * Selects the category for active surveys independently of past surveys.
   * @param categoryId - Category ID, or null to select all categories.
   */
  selectActiveCategory(categoryId: string | null): void {
    this.activeCategoryState.set(categoryId);
  }

  /**
   * Selects the category for past surveys independently of active surveys.
   * @param categoryId - Category ID, or null to select all categories.
   */
  selectPastCategory(categoryId: string | null): void {
    this.pastCategoryState.set(categoryId);
  }
  /** Loads surveys and categories together, preserving existing data on failure. */
  async load(): Promise<void> {
    if (this.isLoading() || this.destroyRef.destroyed) return;
    this.realtime.start();
    this.pendingLoad = this.performLoad();
    await this.pendingLoad;
    this.pendingLoad = null;
    if (this.reloadRequested && !this.destroyRef.destroyed) {
      this.reloadRequested = false;
      await this.load();
    }
  }

  /** Runs one coordinated load and always clears its loading state. */
  private async performLoad(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      await this.loadData();
    } catch {
      this.errorState.set(REPOSITORY_ERROR.REQUEST_FAILED);
    } finally {
      this.loadingState.set(false);
    }
  }

  /** Waits for both requests and updates data only when both succeed. */
  private async loadData(): Promise<void> {
    const [surveys, categories] = await Promise.allSettled([
      this.repository.loadSurveys(), this.repository.loadCategories(),
    ]);
    if (surveys.status === 'rejected' || categories.status === 'rejected') {
      this.errorState.set(REPOSITORY_ERROR.REQUEST_FAILED);
      return;
    }
    this.applyLoadedData(surveys.value, categories.value);
  }

  /**
   * Applies validated results together, preserving existing data if either request failed.
   * @param surveys - Completed survey request result.
   * @param categories - Completed category request result.
   */
  private applyLoadedData(
    surveys: RepositoryResult<readonly SurveyDetail[]>,
    categories: RepositoryResult<readonly SurveyCategoryData[]>,
  ): void {
    if (!surveys.success) {
      this.errorState.set(surveys.error);
      return;
    }
    if (!categories.success) {
      this.errorState.set(categories.error);
      return;
    }
    this.surveyState.set(surveys.data);
    this.categoryState.set(categories.data);
  }

  /**
   * Filters an already status-specific list by its selected category.
   * @param surveys - Active or past surveys in their existing order.
   * @param categoryId - Selected ID, or null for all categories.
   * @returns Matching surveys without changing the source list.
   */
  private filterByCategory(surveys: readonly SurveyDetail[], categoryId: string | null): readonly SurveyDetail[] {
    return categoryId === null ? surveys : surveys.filter((survey: SurveyDetail): boolean => survey.categoryId === categoryId);
  }

  /**
   * Creates a survey and refreshes shared data after a successful write.
   * @param survey - New survey content; concurrent submissions share the pending result.
   * @returns Creation result; a later refresh failure is exposed through error instead.
   */
  createSurvey(survey: CreateSurveyData): Promise<RepositoryResult<string>> {
    if (this.pendingCreation) return this.pendingCreation;
    this.creatingState.set(true);
    this.errorState.set(null);
    this.pendingCreation = this.performCreate(survey).finally((): void => {
      this.creatingState.set(false);
      this.pendingCreation = null;
    });
    return this.pendingCreation;
  }

  /**
   * Persists once, then waits for older reads before requesting fresh data.
   * @param survey - Content forwarded to the repository.
   * @returns The write outcome, independently of the subsequent refresh outcome.
   */
  private async performCreate(survey: CreateSurveyData): Promise<RepositoryResult<string>> {
    try {
      const result: RepositoryResult<string> = await this.repository.createSurvey(survey);
      await this.pendingLoad;
      if (result.success) await this.load();
      else this.errorState.set(result.error);
      return result;
    } catch {
      this.errorState.set(REPOSITORY_ERROR.REQUEST_FAILED);
      return { success: false, error: REPOSITORY_ERROR.REQUEST_FAILED };
    }
  }

  /**
   * Submits one question's answers and refreshes shared survey data.
   * @param questionId - Question receiving the vote.
   * @param optionIds - Selected options; concurrent calls share the pending vote result.
   * @returns Vote outcome; refresh failures are reported separately through error.
   */
  voteForQuestion(questionId: string, optionIds: readonly string[]): Promise<RepositoryResult<void>> {
    if (this.pendingVote) return this.pendingVote;
    this.votingState.set(true);
    this.errorState.set(null);
    this.pendingVote = this.performVote(questionId, optionIds).finally((): void => {
      this.votingState.set(false);
      this.pendingVote = null;
      this.refreshRealtime();
    });
    return this.pendingVote;
  }

  /**
   * Sends a vote once and refreshes after any older load finishes.
   * @param questionId - Question identifier forwarded to the repository.
   * @param optionIds - Answer identifiers forwarded to the repository.
   * @returns The write result, independently of the subsequent refresh result.
   */
  private async performVote(questionId: string, optionIds: readonly string[]): Promise<RepositoryResult<void>> {
    try {
      const result: RepositoryResult<void> = await this.repository.voteForQuestion(questionId, optionIds);
      await this.pendingLoad;
      if (result.success) await this.load();
      else this.errorState.set(result.error);
      return result;
    } catch {
      this.errorState.set(REPOSITORY_ERROR.REQUEST_FAILED);
      return { success: false, error: REPOSITORY_ERROR.REQUEST_FAILED };
    }
  }

  /**
   * Remembers option updates until a pending vote has refreshed server data.
   * @param option - Validated option or null for an unknown change.
   */
  private queueOption(option: SurveyOption | null): void {
    if (option) this.pendingOptions.set(option.id, option);
    else this.unknownChange = true;
  }

  /** Refreshes only changes not already reflected by authoritative loaded data. */
  private refreshRealtime(): void {
    if (this.isVoting() || this.destroyRef.destroyed) return;
    const changed: boolean = this.unknownChange || [...this.pendingOptions.values()].some(
      (option: SurveyOption): boolean => !this.hasCurrentOption(option));
    this.pendingOptions.clear();
    this.unknownChange = false;
    if (!changed) return;
    if (this.isLoading()) this.reloadRequested = true;
    else void this.load();
  }

  /**
   * Checks the complete option so non-vote updates are not discarded.
   * @param option - Realtime option to compare with the last loaded snapshot.
   * @returns Whether the same option values are already present.
   */
  private hasCurrentOption(option: SurveyOption): boolean {
    const current: SurveyOption | undefined = this.surveys().flatMap(
      (survey: SurveyDetail): readonly SurveyOption[] => survey.questions.flatMap((question: SurveyQuestionDetail): readonly SurveyOption[] => question.options))
      .find((candidate: SurveyOption): boolean => candidate.id === option.id);
    return current !== undefined && current.questionId === option.questionId && current.text === option.text
      && current.position === option.position && current.voteCount === option.voteCount;
  }
}
