import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SurveyDetail } from './survey_detail';
import { SurveyStore } from '../../shared/data/survey_store';
import { SurveyRepository } from '../../shared/data/survey_repository';
import type { SurveyDetail as SurveyData } from '../../shared/models/survey_detail';

afterEach((): void => { vi.restoreAllMocks(); });

it.each([null, 2001, 2000, 1999, 0])('checks real time before voting with deadline %s', async (endsAt: number | null): Promise<void> => {
  vi.spyOn(Date, 'now').mockReturnValue(2000);
  const params = new BehaviorSubject(convertToParamMap({ id: 'survey' }));
  const vote = vi.fn().mockResolvedValue({ success: true, data: undefined });
  const survey: SurveyData = {
    id: 'survey', title: 'Team', categoryId: 'category', category: { id: 'category', name: 'Team', slug: 'team' },
    description: null, endsAt, createdAt: 0,
    questions: [{ id: 'q', surveyId: 'survey', text: 'Where?', position: 0, allowsMultipleAnswers: false,
      options: [{ id: 'a', questionId: 'q', text: 'Office', position: 0, voteCount: 0 }],
    }],
  };
  TestBed.configureTestingModule({ providers: [provideRouter([]),
    { provide: ActivatedRoute, useValue: { paramMap: params, snapshot: { paramMap: params.value } } },
    { provide: SurveyStore, useValue: { now: signal(-1), isVoting: signal(false), surveys: signal([]),
      load: vi.fn().mockResolvedValue(undefined), voteForQuestion: vote } },
    { provide: SurveyRepository, useValue: { loadSurveyById: vi.fn().mockResolvedValue({ success: true, data: survey }) } },
  ] });
  const fixture = TestBed.createComponent(SurveyDetail);
  fixture.detectChanges();
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  expect(fixture.componentInstance.isEnded()).toBe(false);
  root.querySelector<HTMLInputElement>('input')!.click();
  root.querySelector<HTMLButtonElement>('.submit_question')!.click();
  await fixture.whenStable();
  fixture.detectChanges();
  if (endsAt === null || endsAt > 2000) {
    expect(vote).toHaveBeenCalledExactlyOnceWith('q', ['a']);
  } else {
    expect(vote).not.toHaveBeenCalled();
    expect(root.querySelector('.vote_status')?.textContent).toBe('Survey ended. Voting is no longer possible.');
    expect(root.querySelector<HTMLInputElement>('input')?.checked).toBe(true);
  }
});