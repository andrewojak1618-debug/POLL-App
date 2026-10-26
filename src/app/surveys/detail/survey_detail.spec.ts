import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import type { SurveyDetail as SurveyData, SurveyQuestionDetail } from '../../shared/models/survey_detail';
import type { RepositoryResult } from '../../shared/data/repository_result';
import { SurveyStore } from '../../shared/data/survey_store';
import { SurveyRepository } from '../../shared/data/survey_repository';
import { SurveyDetail } from './survey_detail';

beforeEach((): void => {
  TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: SurveyStore, useValue: {
    load: vi.fn().mockResolvedValue(undefined), now: signal(Date.now()), isVoting: signal(false), surveys: signal<readonly SurveyData[]>([]),
    voteForQuestion: vi.fn().mockResolvedValue({ success: true, data: undefined }),
  } }, { provide: SurveyRepository, useValue: {
    loadSurveyById: vi.fn().mockResolvedValue({ success: true, data: null }),
    voteForQuestion: vi.fn(),
  } }] });
});

it('reads the ID on direct entry and updates it when the reused route changes', async (): Promise<void> => {
  TestBed.configureTestingModule({ providers: [provideRouter([
    { path: 'surveys/:id', component: SurveyDetail },
  ])] });
  const harness: RouterTestingHarness = await RouterTestingHarness.create();
  const first: SurveyDetail = await harness.navigateByUrl('/surveys/first-id', SurveyDetail);
  expect(first.surveyId()).toBe('first-id');
  const second: SurveyDetail = await harness.navigateByUrl('/surveys/second-id', SurveyDetail);
  expect(second).toBe(first);
  expect(second.surveyId()).toBe('second-id');
  expect(TestBed.inject(SurveyRepository).loadSurveyById).toHaveBeenNthCalledWith(1, 'first-id');
  expect(TestBed.inject(SurveyRepository).loadSurveyById).toHaveBeenNthCalledWith(2, 'second-id');
});

it('represents an absent ID as null', async (): Promise<void> => {
  TestBed.configureTestingModule({ providers: [provideRouter([
    { path: 'surveys', component: SurveyDetail },
  ])] });
  const harness: RouterTestingHarness = await RouterTestingHarness.create();
  const detail: SurveyDetail = await harness.navigateByUrl('/surveys', SurveyDetail);
  expect(detail.surveyId()).toBeNull();
  expect(detail.loadResult()).toEqual({ success: false, error: 'invalid_id' });
  expect(TestBed.inject(SurveyRepository).loadSurveyById).not.toHaveBeenCalled();
});
it('keeps the latest loaded survey when an older request finishes later', async (): Promise<void> => {
  const params = new BehaviorSubject(convertToParamMap({ id: 'first-id' }));
  let resolveFirst!: (value: RepositoryResult<SurveyData | null>) => void;
  const first = new Promise<RepositoryResult<SurveyData | null>>((resolve: (value: RepositoryResult<SurveyData | null> | PromiseLike<RepositoryResult<SurveyData | null>>) => void): void => { resolveFirst = resolve; });
  const survey: SurveyData = {
    id: 'second-id', title: 'Latest', categoryId: 'category-id',
    category: { id: 'category-id', name: 'Team', slug: 'team' },
    description: null, endsAt: null, createdAt: 1, questions: [],
  };
  TestBed.overrideProvider(ActivatedRoute, { useValue: { paramMap: params, snapshot: { paramMap: params.value } } });
  const load = vi.mocked(TestBed.inject(SurveyRepository).loadSurveyById);
  load.mockReturnValueOnce(first).mockResolvedValueOnce({ success: true, data: survey });
  const fixture = TestBed.createComponent(SurveyDetail);
  fixture.detectChanges();
  expect(fixture.componentInstance.loadResult()).toBeNull();
  expect((fixture.nativeElement as HTMLElement).querySelector('.survey_category')).toBeNull();
  expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toBe('Survey details');
  params.next(convertToParamMap({ id: 'second-id' }));
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
  expect(fixture.componentInstance.survey()).toEqual(survey);
  expect((fixture.nativeElement as HTMLElement).querySelector('.survey_category')?.textContent).toBe('Category: Team');
  expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toBe('Latest');
  expect((fixture.nativeElement as HTMLElement).querySelector('.detail_feedback')).toBeNull();
  resolveFirst({ success: false, error: 'request_failed' });
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
  expect(fixture.componentInstance.survey()).toEqual(survey);
  expect((fixture.nativeElement as HTMLElement).querySelector('.survey_category')?.textContent).toBe('Category: Team');
  expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toBe('Latest');
  expect((fixture.nativeElement as HTMLElement).querySelector('.detail_feedback')).toBeNull();
});
it.each([
  { result: { success: true, data: null }, text: 'Survey not found', role: 'status' },
  { result: { success: false, error: 'request_failed' }, text: 'Could not load this survey', role: 'alert' },
  { result: { success: false, error: 'invalid_id' }, text: 'This survey link is invalid', role: 'alert' },
] as const)('replaces loading with $text', async ({ result, text, role }: { result: RepositoryResult<SurveyData | null>; text: string; role: string }): Promise<void> => {
  const params = new BehaviorSubject(convertToParamMap({ id: 'test-id' }));
  TestBed.overrideProvider(ActivatedRoute, { useValue: { paramMap: params, snapshot: { paramMap: params.value } } });
  let finish!: (value: RepositoryResult<SurveyData | null>) => void;
  const pending = new Promise<RepositoryResult<SurveyData | null>>((resolve: (value: RepositoryResult<SurveyData | null> | PromiseLike<RepositoryResult<SurveyData | null>>) => void): void => { finish = resolve; });
  vi.mocked(TestBed.inject(SurveyRepository).loadSurveyById).mockReturnValue(pending);
  const fixture = TestBed.createComponent(SurveyDetail);
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  expect(root.querySelector('.detail_feedback[role="status"]')?.textContent).toContain('Loading survey');
  finish(result);
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
  expect(root.querySelector(`.detail_feedback[role="${role}"]`)?.textContent).toContain(text);
  expect(root.textContent).not.toContain('Loading survey');
  expect(root.querySelectorAll('.detail_feedback').length).toBe(1);
  expect(root.querySelector('.survey_category')).toBeNull();
  expect(root.querySelector('h1')?.textContent).toBe('Survey details');
});
it.each([true, false])('renders optional description and deadline only when present: %s', async (present: boolean): Promise<void> => {
  const params = new BehaviorSubject(convertToParamMap({ id: 'test-id' }));
  TestBed.overrideProvider(ActivatedRoute, { useValue: { paramMap: params, snapshot: { paramMap: params.value } } });
  const survey: SurveyData = {
    id: 'test-id', title: 'Meeting', categoryId: 'category-id',
    category: { id: 'category-id', name: 'Team', slug: 'team' },
    description: present ? 'First line\nSecond line' : null,
    endsAt: present ? Date.parse('2026-07-15T21:59:59.999Z') : null, createdAt: 1, questions: [],
  };
  vi.mocked(TestBed.inject(SurveyRepository).loadSurveyById).mockResolvedValue({ success: true, data: survey });
  const fixture = TestBed.createComponent(SurveyDetail);
  fixture.detectChanges();
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  if (present) {
    expect(root.querySelector('.survey_description')?.textContent).toBe(survey.description);
    expect(root.querySelector('time')?.getAttribute('datetime')).toBe('2026-07-15T21:59:59.999Z');
    expect(root.querySelector('time')?.textContent).toBe('15.07.2026');
  } else {
    expect(root.querySelector('.survey_description')).toBeNull();
    expect(root.querySelector('.survey_deadline')).toBeNull();
  }
});
it('offers a Home link even when no survey is found and navigates on activation', async (): Promise<void> => {
  TestBed.configureTestingModule({ providers: [provideRouter([
    { path: '', component: SurveyDetail },
    { path: 'surveys/:id', component: SurveyDetail },
  ])] });
  const harness: RouterTestingHarness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/surveys/missing-id', SurveyDetail);
  await harness.fixture.whenStable();
  harness.detectChanges();
  const link: HTMLAnchorElement | null = harness.routeNativeElement?.querySelector('.home_link') ?? null;
  expect(link?.getAttribute('aria-label')).toBe('Back to Home');
  expect(link?.querySelector('img')?.getAttribute('src')).toBe('images/dark_logo.svg');
  expect(link?.getAttribute('href')).toBe('/');
  link!.click();
  await harness.fixture.whenStable();
  expect(TestBed.inject(Router).url).toBe('/');
});
it.each([null, 0, 2000])('shows ended only at or after an existing deadline: %s', async (endsAt: number | null): Promise<void> => {
  const now = signal(1000);
  const params = new BehaviorSubject(convertToParamMap({ id: 'survey' }));
  TestBed.overrideProvider(ActivatedRoute, { useValue: { paramMap: params, snapshot: { paramMap: params.value } } });
  TestBed.overrideProvider(SurveyStore, { useValue: {
    now: now.asReadonly(), isVoting: signal(false), surveys: signal([]), load: vi.fn().mockResolvedValue(undefined), voteForQuestion: vi.fn(),
  } });
  const survey: SurveyData = {
    id: 'survey', title: 'Team', categoryId: 'category', category: { id: 'category', name: 'Team', slug: 'team' },
    description: null, endsAt, createdAt: 0, questions: [false, true].map((multiple: boolean, position: number): { id: string; surveyId: string; text: string; position: number; allowsMultipleAnswers: boolean; options: { id: string; questionId: string; text: string; position: number; voteCount: number; }[]; } => ({
      id: 'q' + position, surveyId: 'survey', text: 'Question', position, allowsMultipleAnswers: multiple,
      options: [{ id: 'a' + position, questionId: 'q' + position, text: 'Answer', position: 0, voteCount: 1 }],
    })),
  };
  vi.mocked(TestBed.inject(SurveyRepository).loadSurveyById).mockResolvedValue({ success: true, data: survey });
  const fixture = TestBed.createComponent(SurveyDetail);
  fixture.detectChanges();
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  expect(root.querySelector('.survey_ended')?.textContent?.trim() ?? null).toBe(endsAt === 0 ? 'Survey ended' : null);
  const inputs: NodeListOf<HTMLInputElement> = root.querySelectorAll('input');
  const buttons: NodeListOf<HTMLButtonElement> = root.querySelectorAll('.complete_survey');
  expect(Array.from(inputs, (input: HTMLInputElement): boolean => input.disabled)).toEqual([endsAt === 0, endsAt === 0]);
  expect(Array.from(buttons, (button: HTMLButtonElement): boolean => button.disabled)).toEqual([endsAt === 0]);
  now.set(2000);
  fixture.detectChanges();
  expect(root.querySelector('.survey_ended')?.textContent?.trim() ?? null).toBe(endsAt === null ? null : 'Survey ended');
  expect(Array.from(inputs, (input: HTMLInputElement): boolean => input.disabled)).toEqual([endsAt !== null, endsAt !== null]);
  expect(Array.from(buttons, (button: HTMLButtonElement): boolean => button.disabled)).toEqual([endsAt !== null]);
  if (endsAt !== null) {
    inputs.forEach((input: HTMLInputElement): void => input.click());
    buttons.forEach((button: HTMLButtonElement): void => button.click());
    expect(Array.from(inputs, (input: HTMLInputElement): boolean => input.checked)).toEqual([false, false]);
    expect(TestBed.inject(SurveyStore).voteForQuestion).not.toHaveBeenCalled();
  }
  expect(root.querySelectorAll('.answer_votes').length).toBe(2);
  params.next(convertToParamMap({ id: 'other' }));
  fixture.detectChanges();
  expect(root.querySelector('.survey_ended')).toBeNull();
});
it.each([false, true])('sets initial focus unless the user already moved it (interacted: %s)', async (interacted: boolean): Promise<void> => {
  const params = new BehaviorSubject(convertToParamMap({ id: 'focus-id' }));
  TestBed.overrideProvider(ActivatedRoute, { useValue: { paramMap: params, snapshot: { paramMap: params.value } } });
  let finish!: (value: RepositoryResult<SurveyData | null>) => void;
  vi.mocked(TestBed.inject(SurveyRepository).loadSurveyById).mockReturnValue(new Promise((resolve: (value: RepositoryResult<SurveyData | null> | PromiseLike<RepositoryResult<SurveyData | null>>) => void): void => { finish = resolve; }));
  const fixture = TestBed.createComponent(SurveyDetail);
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const home: HTMLAnchorElement = root.querySelector('.home_link')!;
  if (interacted) home.focus();
  finish({ success: true, data: { id: 'focus-id', title: 'Loaded heading', categoryId: 'cat',
    category: { id: 'cat', name: 'Team', slug: 'team' }, description: null, endsAt: null, createdAt: 0, questions: [] } });
  await fixture.whenStable();
  await Promise.resolve();
  await fixture.whenStable();
  expect(document.activeElement).toBe(interacted ? home : root.querySelector('h1'));
  home.focus();
  fixture.componentInstance.resultsExpanded.set(false);
  await fixture.whenStable();
  expect(document.activeElement).toBe(home);
});

it('retries only unsaved questions after a partial failure', async (): Promise<void> => {
  const survey: SurveyData = {
    id: 'retry', title: 'Retry', categoryId: 'cat', category: { id: 'cat', name: 'Team', slug: 'team' },
    description: null, endsAt: null, createdAt: 0,
    questions: ['q1', 'q2'].map((id: string, position: number): SurveyQuestionDetail => ({
      id, surveyId: 'retry', text: id, position, allowsMultipleAnswers: false,
      options: [{ id: id + 'a', questionId: id, text: 'Answer', position: 0, voteCount: 0 }],
    })),
  };
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'surveys/:id', component: SurveyDetail }])] });
  vi.mocked(TestBed.inject(SurveyRepository).loadSurveyById).mockResolvedValue({ success: true, data: survey });
  const harness: RouterTestingHarness = await RouterTestingHarness.create();
  const component: SurveyDetail = await harness.navigateByUrl('/surveys/retry', SurveyDetail);
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  await harness.fixture.whenStable();
  const vote = vi.mocked(TestBed.inject(SurveyStore).voteForQuestion);
  vote.mockResolvedValueOnce({ success: true, data: undefined })
    .mockResolvedValueOnce({ success: false, error: 'request_failed' })
    .mockResolvedValueOnce({ success: true, data: undefined });
  const form: HTMLFormElement = harness.routeNativeElement!.querySelector('form')!;
  form.querySelectorAll<HTMLInputElement>('input').forEach((input: HTMLInputElement): void => { input.checked = true; });
  const button: HTMLButtonElement = form.querySelector('.complete_survey')!;
  button.click();
  form.dispatchEvent(new Event('submit', { cancelable: true }));
  await harness.fixture.whenStable();
  expect(component.savedQuestionIds()).toEqual(['q1']);
  expect(vote).toHaveBeenCalledTimes(2);
  expect(navigate).not.toHaveBeenCalled();
  component.validateSurvey(form, new Event('submit'));
  await harness.fixture.whenStable();
  expect(vote.mock.calls.map((call): string => call[0])).toEqual(['q1', 'q2', 'q2']);
  expect(component.savedQuestionIds()).toEqual(['q1', 'q2']);
  expect(navigate).not.toHaveBeenCalled();
  expect(component.selectionFeedback()).toContain('saved');
});


