import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, EMPTY, Subject } from 'rxjs';
import { SurveyDetail } from './survey_detail';
import { SurveyRepository } from '../../shared/data/survey_repository';
import { SurveyRealtime } from '../../shared/data/survey_realtime';
import { SurveyStore } from '../../shared/data/survey_store';
import type { SurveyDetail as SurveyData } from '../../shared/models/survey_detail';
import type { SurveyOption } from '../../shared/models/survey_option';

it('refreshes the current detail through shared Realtime while retaining selection', async (): Promise<void> => {
  const votes: Subject<SurveyOption | null> = new Subject();
  const params = new BehaviorSubject(convertToParamMap({ id: 'survey' }));
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
  const loadSurveys = vi.fn().mockResolvedValue({ success: true, data: [survey] });
  const voteForQuestion = vi.fn();
  const start = vi.fn();
  TestBed.configureTestingModule({ providers: [provideRouter([]),
    { provide: ActivatedRoute, useValue: { paramMap: params, snapshot: { paramMap: params.value } } },
    { provide: SurveyRealtime, useValue: { inserts: EMPTY, voteUpdates: votes, start } },
    { provide: SurveyRepository, useValue: { loadSurveys, voteForQuestion,
      loadCategories: vi.fn().mockResolvedValue({ success: true, data: [survey.category] }),
      loadSurveyById: vi.fn().mockResolvedValue({ success: true, data: survey }),
    } },
  ] });
  const fixture = TestBed.createComponent(SurveyDetail);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  expect(start).toHaveBeenCalled();
  const root: HTMLElement = fixture.nativeElement;
  const input: HTMLInputElement = root.querySelector('input')!;
  input.click();
  expect(root.querySelector('.vote_status')?.textContent).toBe('');
  expect(root.querySelector('.question_vote_total')?.textContent).toBe('Total votes: 2');
  loadSurveys.mockResolvedValue({ success: true, data: [updated] });
  votes.next(updated.questions[0].options[0]);
  await vi.waitFor((): void => {
    expect(TestBed.inject(SurveyStore).surveys()[0].questions[0].options[0].voteCount).toBe(2);
  });
  fixture.detectChanges();
  expect(root.querySelector('.vote_status')?.textContent).toBe('Results updated. Question 1: 3 votes.');
  expect(root.querySelector('.question_vote_total')?.textContent).toBe('Total votes: 3');
  expect(root.querySelector('.answer_percentage')?.textContent).toContain('67 %');
  expect(root.querySelector('.answer_votes')?.textContent).toContain('2 votes');
  expect(root.querySelector('input')).toBe(input);
  expect(input.checked).toBe(true);
  expect(voteForQuestion).not.toHaveBeenCalled();
  params.next(convertToParamMap({ id: 'other' }));
  fixture.detectChanges();
  expect(fixture.componentInstance.survey()).toBeNull();
  expect(root.querySelector('.vote_status')?.textContent).toBe('');
});