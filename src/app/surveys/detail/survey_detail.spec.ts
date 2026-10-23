import type { SurveyOption } from '../../shared/models/survey_option';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import type { SurveyDetail as SurveyData } from '../../shared/models/survey_detail';
import type { RepositoryResult } from '../../shared/data/repository_result';
import { SurveyStore } from '../../shared/data/survey_store';
import { SurveyRepository } from '../../shared/data/survey_repository';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
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
  const first = new Promise<RepositoryResult<SurveyData | null>>((resolve): void => { resolveFirst = resolve; });
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
] as const)('replaces loading with $text', async ({ result, text, role }): Promise<void> => {
  const params = new BehaviorSubject(convertToParamMap({ id: 'test-id' }));
  TestBed.overrideProvider(ActivatedRoute, { useValue: { paramMap: params, snapshot: { paramMap: params.value } } });
  let finish!: (value: RepositoryResult<SurveyData | null>) => void;
  const pending = new Promise<RepositoryResult<SurveyData | null>>((resolve): void => { finish = resolve; });
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
    expect(root.querySelector('time')?.textContent).toContain('15 Jul 2026');
    expect(root.querySelector('time')?.textContent).toContain('23:59');
  } else {
    expect(root.querySelector('.survey_description')).toBeNull();
    expect(root.querySelector('.survey_deadline')).toBeNull();
  }
});
it('renders each question with only its own options in the loaded order', async (): Promise<void> => {
  const params = new BehaviorSubject(convertToParamMap({ id: 'survey-id' }));
  TestBed.overrideProvider(ActivatedRoute, { useValue: { paramMap: params, snapshot: { paramMap: params.value } } });
  const survey: SurveyData = {
    id: 'survey-id', title: 'Meeting', categoryId: 'category-id',
    category: { id: 'category-id', name: 'Team', slug: 'team' },
    description: null, endsAt: null, createdAt: 1,
    questions: [
      { id: 'q1', surveyId: 'survey-id', text: 'When?', position: 0, allowsMultipleAnswers: false,
        options: [
          { id: 'a1', questionId: 'q1', text: 'Monday', position: 0, voteCount: 3 },
          { id: 'a2', questionId: 'q1', text: 'Tuesday', position: 1, voteCount: 1 },
        ] },
      { id: 'q2', surveyId: 'survey-id', text: 'Where?', position: 1, allowsMultipleAnswers: true,
        options: [
          { id: 'a3', questionId: 'q2', text: 'Office', position: 0, voteCount: 12 },
          { id: 'a4', questionId: 'q2', text: 'Online', position: 1, voteCount: 0 },
        ] },
    ],
  };
  vi.mocked(TestBed.inject(SurveyRepository).loadSurveyById).mockResolvedValue({ success: true, data: survey });
  const fixture = TestBed.createComponent(SurveyDetail);
  fixture.detectChanges();
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  const sections: NodeListOf<HTMLElement> = root.querySelectorAll('.survey_question');
  expect(sections.length).toBe(2);
  expect(Array.from(root.querySelectorAll<HTMLElement>('.result_fill'), (bar: HTMLElement): string => bar.style.width)).toEqual(['75%', '25%', '100%', '0%']);
  expect(Array.from(root.querySelectorAll('.answer_percentage'), (item: Element): string | undefined => item.textContent?.trim())).toEqual(['75 %', '25 %', '100 %', '0 %']);
  expect(Array.from(root.querySelectorAll('.question_vote_total'), (item: Element): string | null => item.textContent)).toEqual(['Total votes: 4', 'Total votes: 12']);
  expect(sections[0].querySelector('h2')?.textContent).toBe('1. When?');
  expect(sections[1].querySelector('h2')?.textContent).toBe('2. Where?');
  expect(Array.from(sections[0].querySelectorAll('.answer_text'), (item: Element): string | null => item.textContent)).toEqual(['Monday', 'Tuesday']);
  expect(Array.from(sections[1].querySelectorAll('.answer_text'), (item: Element): string | null => item.textContent)).toEqual(['Office', 'Online']);
  expect(Array.from(root.querySelectorAll('.answer_votes'), (item: Element): string | undefined => item.textContent?.trim())).toEqual(['— 3 votes', '— 1 vote', '— 12 votes', '— 0 votes']);
  expect(sections[1].getAttribute('aria-labelledby')).toBe(sections[1].querySelector('h2')?.id);
  const inputs: NodeListOf<HTMLInputElement> = root.querySelectorAll('.answer_label input');
  expect(Array.from(inputs, (input: HTMLInputElement): string => input.type)).toEqual(['radio', 'radio', 'checkbox', 'checkbox']);
  expect(inputs[0].name).toBe(inputs[1].name);
  expect(inputs[0].name).not.toBe(inputs[2].name);
  expect(inputs[0].value).toBe('a1');
  expect(inputs[0].labels?.[0].textContent).toContain('Monday');
  inputs[0].click();
  inputs[1].click();
  inputs[2].click();
  inputs[3].click();
  expect(Array.from(inputs, (input: HTMLInputElement): boolean => input.checked)).toEqual([false, true, true, true]);
  inputs[2].click();
  expect(Array.from(inputs, (input: HTMLInputElement): boolean => input.checked)).toEqual([false, true, false, true]);
  expect(TestBed.inject(SurveyRepository).voteForQuestion).not.toHaveBeenCalled();
  expect(survey.questions[0].options[0].voteCount).toBe(3);
  const submitted = vi.mocked(TestBed.inject(SurveyStore).voteForQuestion);
  const forms: NodeListOf<HTMLFormElement> = root.querySelectorAll('.survey_question form');
  const submission: Event = new Event('submit', { bubbles: true, cancelable: true });
  forms[0].dispatchEvent(submission);
  expect(submission.defaultPrevented).toBe(true);
  expect(submitted).toHaveBeenLastCalledWith('q1', ['a2']);
  inputs[2].click();
  forms[1].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(submitted).toHaveBeenLastCalledWith('q2', ['a3', 'a4']);
  inputs[2].click();
  inputs[3].click();
  forms[1].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(submitted).toHaveBeenCalledTimes(2);
  expect(TestBed.inject(SurveyRepository).voteForQuestion).not.toHaveBeenCalled();
  params.next(convertToParamMap({ id: 'missing-id' }));
  fixture.detectChanges();
  expect(root.querySelector('.survey_questions')).toBeNull();
  expect(fixture.componentInstance.questionVoteTotals().size).toBe(0);
  expect(fixture.componentInstance.answerPercentages().size).toBe(0);
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
  expect(link?.textContent).toBe('Back to Home');
  expect(link?.getAttribute('href')).toBe('/');
  link!.click();
  await harness.fixture.whenStable();
  expect(TestBed.inject(Router).url).toBe('/');
});
it.each([true, false])('blocks repeated submissions until the vote completes: success=%s', async (success: boolean): Promise<void> => {
  const params = new BehaviorSubject(convertToParamMap({ id: 'survey' }));
  const voting = signal(false);
  let finish!: (result: RepositoryResult<void>) => void;
  const pending = new Promise<RepositoryResult<void>>((resolve): void => { finish = resolve; });
  const vote = vi.fn((): Promise<RepositoryResult<void>> => {
    voting.set(true);
    return pending.finally((): void => voting.set(false));
  });
  TestBed.overrideProvider(SurveyStore, { useValue: { load: vi.fn().mockResolvedValue(undefined), now: signal(Date.now()), isVoting: voting.asReadonly(), surveys: signal<readonly SurveyData[]>([]), voteForQuestion: vote } });
  TestBed.overrideProvider(ActivatedRoute, { useValue: { paramMap: params, snapshot: { paramMap: params.value } } });
  const survey: SurveyData = {
    id: 'survey', title: 'Team', categoryId: 'category', category: { id: 'category', name: 'Team', slug: 'team' },
    description: null, endsAt: null, createdAt: 0,
    questions: ['q1', 'q2'].map((id: string, position: number) => ({
      id, surveyId: 'survey', text: id, position, allowsMultipleAnswers: false,
      options: [{ id: id + '_option', questionId: id, text: 'Yes', position: 0, voteCount: 0 }],
    })),
  };
  vi.mocked(TestBed.inject(SurveyRepository).loadSurveyById).mockResolvedValue({ success: true, data: survey });
  const fixture = TestBed.createComponent(SurveyDetail);
  fixture.detectChanges();
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  expect(Array.from(root.querySelectorAll('.question_vote_total'), (item: Element): string | null => item.textContent)).toEqual(['Total votes: 0', 'Total votes: 0']);
  expect(Array.from(root.querySelectorAll('.answer_percentage'), (item: Element): string | undefined => item.textContent?.trim())).toEqual(['0 %', '0 %']);
  const forms: NodeListOf<HTMLFormElement> = root.querySelectorAll('form');
  const buttons: NodeListOf<HTMLButtonElement> = root.querySelectorAll('.submit_question');
  const inputs: NodeListOf<HTMLInputElement> = root.querySelectorAll('input');
  inputs.forEach((input: HTMLInputElement): void => input.click());
  buttons[0].click();
  forms[0].dispatchEvent(new Event('submit', { cancelable: true }));
  forms[1].dispatchEvent(new Event('submit', { cancelable: true }));
  expect(vote).toHaveBeenCalledExactlyOnceWith('q1', ['q1_option']);
  fixture.detectChanges();
  expect(Array.from(buttons, (button: HTMLButtonElement): boolean => button.disabled)).toEqual([true, true]);
  buttons[1].click();
  expect(vote).toHaveBeenCalledTimes(1);
  finish(success ? { success: true, data: undefined } : { success: false, error: 'request_failed' });
  await fixture.whenStable();
  fixture.detectChanges();
  expect(Array.from(buttons, (button: HTMLButtonElement): boolean => button.disabled)).toEqual([false, false]);
  expect(Array.from(inputs, (input: HTMLInputElement): boolean => input.checked)).toEqual([true, true]);
  buttons[1].click();
  await fixture.whenStable();
  expect(vote).toHaveBeenLastCalledWith('q2', ['q2_option']);
  expect(vote).toHaveBeenCalledTimes(2);
});
it('rounds thirds independently for a multiple-choice question', async (): Promise<void> => {
  const params = new BehaviorSubject(convertToParamMap({ id: 'survey' }));
  TestBed.overrideProvider(ActivatedRoute, { useValue: { paramMap: params, snapshot: { paramMap: params.value } } });
  const survey: SurveyData = {
    id: 'survey', title: 'Team', categoryId: 'category', category: { id: 'category', name: 'Team', slug: 'team' },
    description: null, endsAt: null, createdAt: 0,
    questions: [{ id: 'q', surveyId: 'survey', text: 'Activities?', position: 0, allowsMultipleAnswers: true,
      options: ['a', 'b', 'c'].map((id: string, position: number): SurveyOption => ({
        id, questionId: 'q', text: id, position, voteCount: 1,
      })),
    }],
  };
  vi.mocked(TestBed.inject(SurveyRepository).loadSurveyById).mockResolvedValue({ success: true, data: survey });
  const fixture = TestBed.createComponent(SurveyDetail);
  fixture.detectChanges();
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
  expect(fixture.componentInstance.questionVoteTotals().get('q')).toBe(3);
  expect([...fixture.componentInstance.answerPercentages().values()]).toEqual([33, 33, 33]);
});
it.each([true, false])('updates displayed results only after a successful own vote: %s', async (success: boolean): Promise<void> => {
  const params = new BehaviorSubject(convertToParamMap({ id: 'survey' }));
  TestBed.overrideProvider(ActivatedRoute, { useValue: { paramMap: params, snapshot: { paramMap: params.value } } });
  const survey: SurveyData = {
    id: 'survey', title: 'Team', categoryId: 'category', category: { id: 'category', name: 'Team', slug: 'team' },
    description: null, endsAt: null, createdAt: 0,
    questions: [{ id: 'q', surveyId: 'survey', text: 'Where?', position: 0, allowsMultipleAnswers: false,
      options: ['a', 'b'].map((id: string, position: number): SurveyOption => ({
        id, questionId: 'q', text: id, position, voteCount: 1,
      })),
    }],
  };
  const updated: SurveyData = { ...survey, questions: [{ ...survey.questions[0], options: [
    { ...survey.questions[0].options[0], voteCount: 2 }, survey.questions[0].options[1],
  ] }] };
  let finish!: (result: RepositoryResult<void>) => void;
  const pending = new Promise<RepositoryResult<void>>((resolve): void => { finish = resolve; });
  TestBed.overrideProvider(SurveyStore, { useValue: {
    load: vi.fn().mockResolvedValue(undefined), now: signal(Date.now()), isVoting: signal(false), surveys: signal([updated]), voteForQuestion: vi.fn().mockReturnValue(pending),
  } });
  vi.mocked(TestBed.inject(SurveyRepository).loadSurveyById).mockResolvedValue({ success: true, data: survey });
  const fixture = TestBed.createComponent(SurveyDetail);
  fixture.detectChanges();
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  root.querySelector<HTMLInputElement>('input')!.click();
  const submitting: Promise<void> = fixture.componentInstance.submitQuestion(survey.questions[0], root.querySelector('form')!, new Event('submit'));
  expect(fixture.componentInstance.questionVoteTotals().get('q')).toBe(2);
  fixture.detectChanges();
  expect(root.querySelector('.vote_status')?.textContent).toContain('Submitting your vote');
  finish(success ? { success: true, data: undefined } : { success: false, error: 'request_failed' });
  await submitting;
  fixture.detectChanges();
  expect(root.querySelector('.vote_status')?.textContent).toBe(success ? 'Your vote has been saved.' : 'Your vote could not be saved. Please try again.');
  expect(root.querySelector('.vote_status')?.getAttribute('aria-live')).toBe('polite');
  expect(root.querySelector('.question_vote_total')?.textContent).toBe(success ? 'Total votes: 3' : 'Total votes: 2');
  expect(Array.from(root.querySelectorAll('.answer_percentage'), (item: Element): string | undefined => item.textContent?.trim())).toEqual(success ? ['67 %', '33 %'] : ['50 %', '50 %']);
  expect(root.querySelector('.answer_votes')?.textContent).toContain(success ? '2 votes' : '1 vote');
  expect(root.querySelector<HTMLInputElement>('input')?.checked).toBe(true);
  expect(TestBed.inject(SurveyRepository).loadSurveyById).toHaveBeenCalledTimes(1);
  const vote = vi.mocked(TestBed.inject(SurveyStore).voteForQuestion);
  expect(vote).toHaveBeenCalledTimes(1);
  if (success) {
    expect(root.querySelector('.vote_error')).toBeNull();
  } else {
    expect(root.querySelector('.vote_error')?.textContent).toContain('Press Vote to try again.');
    expect(root.querySelector('.submit_question')?.getAttribute('aria-describedby')).toBe('vote_error_q');
    expect(root.querySelector<HTMLButtonElement>('.submit_question')?.disabled).toBe(false);
    vote.mockResolvedValueOnce({ success: true, data: undefined });
    root.querySelector<HTMLButtonElement>('.submit_question')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(vote).toHaveBeenCalledTimes(2);
    expect(vote).toHaveBeenLastCalledWith('q', ['a']);
    expect(root.querySelector('.vote_error')).toBeNull();
    expect(root.querySelector('.submit_question')?.hasAttribute('aria-describedby')).toBe(false);
    expect(root.querySelector<HTMLInputElement>('input')?.checked).toBe(true);
  }
  params.next(convertToParamMap({ id: 'other' }));
  fixture.detectChanges();
  expect(fixture.componentInstance.survey()).toBeNull();
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
    description: null, endsAt, createdAt: 0, questions: [false, true].map((multiple: boolean, position: number) => ({
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
  expect(root.querySelector('.survey_ended')?.textContent ?? null).toBe(endsAt === 0 ? 'Survey ended' : null);
  const inputs: NodeListOf<HTMLInputElement> = root.querySelectorAll('input');
  const buttons: NodeListOf<HTMLButtonElement> = root.querySelectorAll('.submit_question');
  expect(Array.from(inputs, (input: HTMLInputElement): boolean => input.disabled)).toEqual([endsAt === 0, endsAt === 0]);
  expect(Array.from(buttons, (button: HTMLButtonElement): boolean => button.disabled)).toEqual([endsAt === 0, endsAt === 0]);
  now.set(2000);
  fixture.detectChanges();
  expect(root.querySelector('.survey_ended')?.textContent ?? null).toBe(endsAt === null ? null : 'Survey ended');
  expect(Array.from(inputs, (input: HTMLInputElement): boolean => input.disabled)).toEqual([endsAt !== null, endsAt !== null]);
  expect(Array.from(buttons, (button: HTMLButtonElement): boolean => button.disabled)).toEqual([endsAt !== null, endsAt !== null]);
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