import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SurveyHighlights } from './survey-highlights';
import { SurveyStore } from '../../shared/data/survey_store';
import type { SurveyDetail } from '../../shared/models/survey_detail';

const NOW: number = 1000000;
const SURVEY: SurveyDetail = {
  id: 'highlight-id', title: 'Loaded highlight', categoryId: 'category-id',
  category: { id: 'category-id', name: 'Loaded category', slug: 'loaded' },
  description: null, endsAt: NOW + 3600000, createdAt: NOW, questions: [],
};

describe('store-backed highlights', () => {
  it('renders loaded category and deadline, then reacts to an empty store list', async () => {
    const surveys = signal<readonly SurveyDetail[]>([SURVEY]);
    TestBed.configureTestingModule({ providers: [{ provide: SurveyStore, useValue: {
      endingSoonSurveys: surveys.asReadonly(), now: signal(NOW).asReadonly(),
    } }] });
    const fixture = TestBed.createComponent(SurveyHighlights);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h4')?.textContent).toBe('Loaded highlight');
    expect(element.querySelector('.category')?.textContent).toBe('Loaded category');
    expect(element.querySelector('.deadline')?.textContent).toBe('Ends in 1 Day');
    surveys.set([]);
    await fixture.whenStable();
    expect(element.querySelector('app-highlight-card')).toBeNull();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('No surveys ending within the next 24 hours.');
  });
});