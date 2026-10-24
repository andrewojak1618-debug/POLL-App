import type { Observable } from 'rxjs';
import { afterRenderEffect, Component, computed, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ParamMap } from '@angular/router';
import { catchError, defer, distinctUntilChanged, map, of, startWith, switchMap, tap } from 'rxjs';

import { SurveyStore } from '../../shared/data/survey_store';
import { SurveyRepository } from '../../shared/data/survey_repository';
import { REPOSITORY_ERROR } from '../../shared/data/repository_result';
import type { RepositoryResult } from '../../shared/data/repository_result';
import type { SurveyDetail as SurveyData, SurveyQuestionDetail } from '../../shared/models/survey_detail';
import type { SurveyOption } from '../../shared/models/survey_option';
import { PrimaryButton } from '../../shared/ui/primary_button/primary_button';

const DEADLINE_FORMAT: Intl.DateTimeFormat = new Intl.DateTimeFormat('de-DE', {
  timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
});


/** Selected answer IDs belonging to one question. */
export interface QuestionSubmission {
  readonly questionId: string;
  readonly optionIds: readonly string[];
}

type SurveyResult = RepositoryResult<SurveyData | null>;

@Component({
  selector: 'app-survey-detail',
  imports: [RouterLink, PrimaryButton],
  templateUrl: './survey_detail.html',
  styleUrl: './survey_detail.scss',
})
export class SurveyDetail {
  /** Returns spreadsheet-style answer letters, continuing with AA after Z. */
  answerLetter(index: number): string {
    const alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let label: string = '';
    for (let position: number = index + 1; position > 0; position = Math.floor((position - 1) / alphabet.length)) {
      label = alphabet[(position - 1) % alphabet.length] + label;
    }
    return label;
  }

  private readonly router: Router = inject(Router);
  readonly isCompleting: WritableSignal<boolean> = signal(false);
  readonly savedQuestionIds: WritableSignal<readonly string[]> = signal([]);
  readonly invalidQuestionIds: WritableSignal<readonly string[]> = signal([]);
  readonly selectionFeedback: WritableSignal<string> = signal('');

  /** Validates all remaining questions before starting the sequential vote submission. */
  validateSurvey(form: HTMLFormElement, event: Event): void {
    event.preventDefault();
    if (!this.canSubmitVote() || this.isVoting() || this.isCompleting()) return;
    const values: FormData = new FormData(form);
    const invalid: readonly SurveyQuestionDetail[] = (this.survey()?.questions ?? []).filter(
      (question: SurveyQuestionDetail): boolean => !this.savedQuestionIds().includes(question.id) && !this.hasValidSelection(question, values));
    this.invalidQuestionIds.set(invalid.map((question: SurveyQuestionDetail): string => question.id));
    this.selectionFeedback.set(invalid.length ? 'Please answer every question.' : '');
    const input: HTMLInputElement | undefined = Array.from(form.querySelectorAll('input')).find(
      (element: HTMLInputElement): boolean => element.name === 'question_' + invalid[0]?.id);
    input?.focus();
    if (!invalid.length) void this.completeSurvey(values);
  }

  /** Locks the entire sequence, including the gaps between individual repository calls. */
  private async completeSurvey(values: FormData): Promise<void> {
    const sourceId: string | null = this.surveyId();
    const questions: readonly SurveyQuestionDetail[] = this.survey()?.questions ?? [];
    this.isCompleting.set(true);
    try {
      for (const question of questions) {
        if (this.surveyId() !== sourceId) return;
        if (this.savedQuestionIds().includes(question.id)) continue;
        if (!this.canSubmitVote() || !await this.saveSelectedQuestion(question, values, sourceId)) return;
      }
      this.selectionFeedback.set('Your survey answers have been saved.');
      await this.router.navigate(['/'], { info: 'focus_home_heading' });
    } finally { this.isCompleting.set(false); }
  }

  /** Remembers only acknowledged writes; retries skip these questions within this view. */
  private async saveSelectedQuestion(question: SurveyQuestionDetail, values: FormData, sourceId: string | null): Promise<boolean> {
    const optionIds: string[] = values.getAll('question_' + question.id).filter(
      (value: FormDataEntryValue): value is string => typeof value === 'string');
    this.selectionFeedback.set('Saving your answers…');
    const result: RepositoryResult<void> = await this.store.voteForQuestion(question.id, optionIds);
    if (this.surveyId() !== sourceId) return false;
    if (result.success) this.savedQuestionIds.update((ids: readonly string[]): readonly string[] => [...ids, question.id]);
    else this.selectionFeedback.set('Could not save all answers. Your selection is still here. Press Complete survey to retry the remaining questions.');
    return result.success;
  }

  /** Validates cardinality and membership within the question's own answer options. */
  private hasValidSelection(question: SurveyQuestionDetail, values: FormData): boolean {
    const selected: FormDataEntryValue[] = values.getAll('question_' + question.id);
    return selected.length > 0 && (question.allowsMultipleAnswers || selected.length === 1)
      && selected.every((value: FormDataEntryValue): boolean => question.options.some(
        (option: SurveyOption): boolean => option.id === value));
  }

  /** Clears feedback when the user changes the selection, so a previous result cannot become stale. */
  clearSelectionFeedback(): void {
    this.invalidQuestionIds.set([]);
    this.selectionFeedback.set('');
  }

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly heading = viewChild<ElementRef<HTMLHeadingElement>>('surveyHeading');
  private focusedSurveyId: string | null | undefined = undefined;
  /** Registers route-heading focus without interrupting a user who already moved focus. */
  private registerInitialFocus(): void {
    afterRenderEffect((): void => {
      if (this.loadResult() === null || !this.heading()) return;
      const id: string | null = this.surveyId();
      if (this.focusedSurveyId === id) return;
      this.focusedSurveyId = id;
      const active: Element | null = this.host.nativeElement.ownerDocument.activeElement;
      if (active && this.host.nativeElement.contains(active)) return;
      this.heading()?.nativeElement.focus({ preventScroll: true });
    });
  }

  readonly resultsExpanded: WritableSignal<boolean> = signal(true);
  private readonly store: SurveyStore = inject(SurveyStore);
  private readonly repository: SurveyRepository = inject(SurveyRepository);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly initialStoreData: WritableSignal<readonly SurveyData[]> = signal([]);
  private readonly votedSurvey: WritableSignal<{ source: SurveyData; data: SurveyData } | null> = signal(null);
  private readonly failedQuestionState: WritableSignal<string | null> = signal(null);
  readonly failedQuestionId: Signal<string | null> = this.failedQuestionState.asReadonly();
  private readonly announcementState: WritableSignal<string> = signal('');
  readonly announcement: Signal<string> = this.announcementState.asReadonly();
  readonly isVoting: Signal<boolean> = this.store.isVoting;
  readonly surveyId: Signal<string | null> = toSignal(
    this.route.paramMap.pipe(map((params: ParamMap): string | null => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') },
  );
  readonly loadResult: Signal<SurveyResult | null> = toSignal(
    this.route.paramMap.pipe(
      map((params: ParamMap): string | null => params.get('id')),
      distinctUntilChanged(),
      switchMap((id: string | null): Observable<SurveyResult | null> => id === null
        ? of<SurveyResult>({ success: false, error: REPOSITORY_ERROR.INVALID_ID })
        : defer((): Promise<RepositoryResult<SurveyData | null>> => this.repository.loadSurveyById(id)).pipe(
          catchError((): Observable<SurveyResult> => of<SurveyResult>({ success: false, error: REPOSITORY_ERROR.REQUEST_FAILED })),
          tap((): void => this.initialStoreData.set(this.store.surveys())),
          startWith(null),
        )),
    ),
    { initialValue: null },
  );
  readonly survey: Signal<SurveyData | null> = computed((): SurveyData | null => {
    const result: SurveyResult | null = this.loadResult();
    if (!result?.success || !result.data) return null;
    const stored: readonly SurveyData[] = this.store.surveys();
    const live: SurveyData | undefined = stored !== this.initialStoreData()
      ? stored.find((survey: SurveyData): boolean => survey.id === result.data?.id) : undefined;
    if (live) return live;
    const updated: { source: SurveyData; data: SurveyData } | null = this.votedSurvey();
    return updated?.source === result.data ? updated.data : result.data;
  });
  /** Sums selected answers per question; multiple answers are not unique participants. */
  readonly questionVoteTotals: Signal<ReadonlyMap<string, number>> = computed((): ReadonlyMap<string, number> =>
    new Map((this.survey()?.questions ?? []).map((question: SurveyQuestionDetail): [string, number] => [
      question.id,
      question.options.reduce((total: number, option: SurveyOption): number => total + option.voteCount, 0),
    ])));
  /** Derives each answer's rounded share of its question's selected answers. */
  readonly answerPercentages: Signal<ReadonlyMap<string, number>> = computed((): ReadonlyMap<string, number> =>
    new Map((this.survey()?.questions ?? []).flatMap((question: SurveyQuestionDetail): [string, number][] => {
      const total: number = this.questionVoteTotals().get(question.id) ?? 0;
      return question.options.map((option: SurveyOption): [string, number] => [
        option.id, total === 0 ? 0 : Math.round((option.voteCount / total) * 100),
      ]);
    })));
  /** No deadline means active; equality with the current time already counts as ended. */
  readonly isEnded: Signal<boolean> = computed((): boolean => {
    const endsAt: number | null = this.survey()?.endsAt ?? null;
    return endsAt !== null && endsAt <= this.store.now();
  });
  readonly deadline: Signal<{ readonly label: string; readonly iso: string } | null> = computed((): { label: string; iso: string; } | null => {
    const endsAt: number | null = this.survey()?.endsAt ?? null;
    return endsAt === null ? null : {
      label: DEADLINE_FORMAT.format(endsAt),
      iso: new Date(endsAt).toISOString(),
    };
  });

  /** Loads shared data on direct entry and announces external vote changes without repeating own-vote feedback. */
  constructor() {
    this.registerInitialFocus();
    void this.store.load();
    let previous: string = '';
    let previousId: string | null = null;
    effect((): void => {
      const survey: SurveyData | null = this.survey();
      const counts: string = JSON.stringify(survey?.questions.map((question: SurveyQuestionDetail): number[] =>
        question.options.map((option: SurveyOption): number => option.voteCount)) ?? []);
      if (survey?.id !== previousId) {
        this.savedQuestionIds.set([]);
        this.clearSelectionFeedback();
        this.announcementState.set('');
        this.failedQuestionState.set(null);
      }
      else if (counts !== previous && !untracked(this.isVoting) && survey !== untracked(this.votedSurvey)?.data) {
        this.announcementState.set(this.describeResults(survey));
      }
      previousId = survey?.id ?? null;
      previous = counts;
    });
  }

  /**
   * Submits the selected answers for one question through the shared store.
   * @param question - Question whose answer selection is submitted.
   * @param form - Form containing only this question's answer controls.
   * @param event - Native submission whose page navigation is prevented.
   * @returns Completion after the store has processed the vote.
   */
  async submitQuestion(question: SurveyQuestionDetail, form: HTMLFormElement, event: Event): Promise<void> {
    event.preventDefault();
    if (this.isVoting()) return;
    const values: FormDataEntryValue[] = new FormData(form).getAll('question_' + question.id);
    const optionIds: string[] = values.filter((value: FormDataEntryValue): value is string => typeof value === 'string');
    if (optionIds.length === 0 || (!question.allowsMultipleAnswers && optionIds.length !== 1)) return;
    if (!optionIds.every((id: string): boolean => question.options.some((option: SurveyOption): boolean => option.id === id))) return;
    const submission: QuestionSubmission = { questionId: question.id, optionIds };
    await this.saveVote(submission);
  }
  /**
   * Uses the store's refreshed server snapshot after a successful vote.
   * @param submission - Selected answers belonging to one question.
   * @returns Completion without replacing data from a different route load.
   */
  private async saveVote(submission: QuestionSubmission): Promise<void> {
    if (!this.canSubmitVote()) return;
    const source: SurveyResult | null = this.loadResult();
    this.failedQuestionState.set(null);
    this.announcementState.set('Submitting your vote…');
    const result: RepositoryResult<void> = await this.store.voteForQuestion(submission.questionId, submission.optionIds);
    if (this.loadResult() !== source) return;
    this.failedQuestionState.set(result.success ? null : submission.questionId);
    this.announcementState.set(result.success ? 'Your vote has been saved.' : 'Your vote could not be saved. Please try again.');
    if (!result.success || !source?.success || !source.data) return;
    const updated: SurveyData | undefined = this.store.surveys().find((survey: SurveyData): boolean => survey.id === source.data?.id);
    if (updated) this.votedSurvey.set({ source: source.data, data: updated });
  }
  /**
   * Summarizes updated totals without reading the entire answer list.
   * @param survey - Currently displayed survey, if available.
   * @returns A concise announcement with totals for each question.
   */
  private describeResults(survey: SurveyData | null): string {
    const totals: string[] = (survey?.questions ?? []).map((question: SurveyQuestionDetail, index: number): string => {
      const total: number = question.options.reduce((sum: number, option: SurveyOption): number => sum + option.voteCount, 0);
      return 'Question ' + (index + 1) + ': ' + total + (total === 1 ? ' vote.' : ' votes.');
    });
    return 'Results updated. ' + totals.join(' ');
  }
  /**
   * Checks the current deadline immediately before submitting, independently of the display timer.
   * @returns Whether a loaded survey still accepts votes at the current time.
   */
  private canSubmitVote(): boolean {
    const survey: SurveyData | null = this.survey();
    if (!survey) return false;
    if (survey.endsAt !== null && survey.endsAt <= Date.now()) {
      this.failedQuestionState.set(null);
      this.announcementState.set('Survey ended. Voting is no longer possible.');
      return false;
    }
    return true;
  }
}
