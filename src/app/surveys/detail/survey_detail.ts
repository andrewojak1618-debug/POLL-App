import { afterRenderEffect, Component, computed, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ParamMap } from '@angular/router';
import { catchError, defer, distinctUntilChanged, map, of, startWith, switchMap, tap } from 'rxjs';
import { SurveyStore } from '../../shared/data/survey_store';
import { SurveyRepository } from '../../shared/data/survey_repository';
import type { RepositoryResult } from '../../shared/data/repository_result';
import type { SurveyDetail as SurveyData, SurveyQuestionDetail } from '../../shared/models/survey_detail';

const DEADLINE_FORMAT: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Berlin', year: 'numeric', month: 'short', day: 'numeric',
  hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
});

import type { SurveyOption } from '../../shared/models/survey_option';
import { PrimaryButton } from '../../shared/ui/primary-button/primary-button';

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
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly heading = viewChild<ElementRef<HTMLHeadingElement>>('surveyHeading');
  private focusedSurveyId: string | null | undefined = undefined;
  private readonly initialFocus = afterRenderEffect((): void => {
    if (this.loadResult() === null || !this.heading()) return;
    const id: string | null = this.surveyId();
    if (this.focusedSurveyId === id) return;
    this.focusedSurveyId = id;
    const active: Element | null = this.host.nativeElement.ownerDocument.activeElement;
    if (active && this.host.nativeElement.contains(active)) return;
    this.heading()?.nativeElement.focus({ preventScroll: true });
  });

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
      switchMap((id: string | null) => id === null
        ? of<SurveyResult>({ success: false, error: 'invalid_id' })
        : defer(() => this.repository.loadSurveyById(id)).pipe(
          catchError(() => of<SurveyResult>({ success: false, error: 'request_failed' })),
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
  /** A missing deadline stays active; the deadline itself is already expired. */
  readonly isEnded: Signal<boolean> = computed((): boolean => {
    const endsAt: number | null = this.survey()?.endsAt ?? null;
    return endsAt !== null && endsAt <= this.store.now();
  });
  readonly deadline: Signal<{ readonly label: string; readonly iso: string } | null> = computed(() => {
    const endsAt: number | null = this.survey()?.endsAt ?? null;
    return endsAt === null ? null : {
      label: DEADLINE_FORMAT.format(endsAt),
      iso: new Date(endsAt).toISOString(),
    };
  });

  /** Starts shared loading and the existing singleton Realtime channel on direct entry. */
  constructor() {
    void this.store.load();
    let previous: string = '';
    let previousId: string | null = null;
    effect((): void => {
      const survey: SurveyData | null = this.survey();
      const counts: string = JSON.stringify(survey?.questions.map((question: SurveyQuestionDetail): number[] =>
        question.options.map((option: SurveyOption): number => option.voteCount)) ?? []);
      if (survey?.id !== previousId) {
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