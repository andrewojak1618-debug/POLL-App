import { TestBed } from '@angular/core/testing';

import type { CreateSurveyData } from '../shared/models/create_survey_data';
import { SurveyForm } from './survey_form/survey_form';
import { resolveSurveyDeadline } from './survey_form_deadline';
import { toCreateSurveyData } from './survey_form_mapping';

describe('Berlin deadline', (): void => {
  it.each([
    ['2026-01-15', '2026-01-15T22:59:59.999Z'],
    ['2026-07-15', '2026-07-15T21:59:59.999Z'],
    ['2026-03-29', '2026-03-29T21:59:59.999Z'],
    ['2026-10-25', '2026-10-25T22:59:59.999Z'],
  ])('resolves %s to %s', (date: string, expected: string): void => {
    expect(resolveSurveyDeadline(date)).toBe(Date.parse(expected));
  });
  it('supports no deadline and rejects invalid calendar dates', (): void => {
    const now: number = Date.now();
    expect(resolveSurveyDeadline('')).toBeGreaterThanOrEqual(now + 86400000);
    expect(resolveSurveyDeadline('')).toBeLessThanOrEqual(Date.now() + 86400000);
    expect((): number | null => resolveSurveyDeadline('2026-02-30')).toThrow();
    expect((): number | null => resolveSurveyDeadline('invalid')).toThrow();
  });
});

describe('Creation form mapping', (): void => {
  it('reads once and emits ordered creation data without changing the form', (): void => {
    const form: SurveyForm = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
    form.fields.name.setValue('Meeting');
    form.fields.category.setValue('category-id');
    form.questions.at(0).controls.question.setValue('When?');
    form.questions.at(0).answers.setValue(['Monday', 'Tuesday']);
    form.addQuestion();
    form.questions.at(1).controls.question.setValue('Where?');
    form.questions.at(1).controls.multipleAnswers.setValue(true);
    form.questions.at(1).answers.setValue(['Office', 'Online', 'Outside']);
    const read = vi.spyOn(form.form, 'getRawValue');
    const emit = vi.spyOn(form.validatedSurvey, 'emit');
    form.submit();
    expect(read).toHaveBeenCalledOnce();
    expect(emit).toHaveBeenCalledExactlyOnceWith({
      title: 'Meeting', categoryId: 'category-id', description: null, endsAt: expect.any(Number),
      questions: [
        { text: 'When?', allowsMultipleAnswers: false, options: [{ text: 'Monday' }, { text: 'Tuesday' }] },
        { text: 'Where?', allowsMultipleAnswers: true, options: [{ text: 'Office' }, { text: 'Online' }, { text: 'Outside' }] },
      ],
    });
    expect(form.fields.name.value).toBe('Meeting');
  });

  it('does not read or emit invalid forms', (): void => {
    const form: SurveyForm = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
    const read = vi.spyOn(form.form, 'getRawValue');
    const emit = vi.spyOn(form.validatedSurvey, 'emit');
    form.submit();
    expect(read).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('keeps description content and includes an explicitly resolved deadline', (): void => {
    const deadline: number = resolveSurveyDeadline('2026-07-15')!;
    const value = { name: 'Meeting', category: 'id', description: ' Notes ', endDate: '2026-07-15', questions: [] };
    expect(toCreateSurveyData(value, deadline)).toMatchObject({ description: ' Notes ', endsAt: deadline });
    expect((): CreateSurveyData => toCreateSurveyData(value, null)).toThrow();
    expect(toCreateSurveyData({ ...value, description: '  ' }, deadline).description).toBeNull();
  });
});
it.each([
  ['2026-10-25', false], ['2026-10-26', true], ['2026-10-27', true], ['', true],
])('validates end date %s at submission without losing inputs', (date: string, accepted: boolean): void => {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-26T10:00:00Z'));
  try {
    const form: SurveyForm = TestBed.runInInjectionContext((): SurveyForm => new SurveyForm());
    form.fields.name.setValue('Meeting');
    form.fields.category.setValue('category-id');
    form.fields.endDate.setValue(date);
    form.questions.at(0).controls.question.setValue('When?');
    form.questions.at(0).answers.setValue(['Monday', 'Tuesday']);
    const emit = vi.spyOn(form.validatedSurvey, 'emit');
    form.submit();
    expect(emit).toHaveBeenCalledTimes(accepted ? 1 : 0);
    expect(form.conversionError()).toBe(accepted ? null : 'Choose today or a future end date.');
    expect(form.fields.name.value).toBe('Meeting');
    expect(form.fields.endDate.value).toBe(date);
  } finally {
    clock.mockRestore();
  }
});
