import { readTimestamp, writeTimestamp, readDeadline } from './survey_dates';
import { mapSurveyDetail } from './survey_detail_mapper';
import { mapOption, mapQuestion, mapSurvey } from './survey_rows';

const CATEGORY = { id: '00000000-0000-0000-0000-000000000001', name: 'Team', slug: 'team' };
const SURVEY = { id: '00000000-0000-0000-0000-000000000002', category_id: CATEGORY.id,
  title: 'Team event', description: null, deadline: null, created_at: '2026-10-14T08:16:52.462024+00:00' };
const QUESTIONS = [
  { id: '00000000-0000-0000-0000-000000000003', survey_id: SURVEY.id, text: 'Day?', position: 0, allows_multiple_answers: false },
  { id: '00000000-0000-0000-0000-000000000004', survey_id: SURVEY.id, text: 'Activities?', position: 1, allows_multiple_answers: true },
];
const OPTIONS = QUESTIONS.flatMap((q, index) => [0, 1].map((position) => ({
  id: `00000000-0000-0000-0000-00000000000${5 + index * 2 + position}`,
  question_id: q.id, text: `Option ${position}`, position, vote_count: position,
})));

describe('Timestamp boundary conversion', () => {
  it('preserves the instant for offsets and truncates PostgreSQL microseconds', () => {
    expect(readTimestamp(SURVEY.created_at)).toBe(1791965812462);
    expect(readTimestamp('2026-10-14 10:16:52.462024+02')).toBe(1791965812462);
    expect(writeTimestamp(readTimestamp(SURVEY.created_at))).toBe('2026-10-14T08:16:52.462Z');
    expect(readDeadline(null)).toBeNull();
    expect(writeTimestamp(null)).toBeNull();
  });
  it.each(['2026-02-30T12:00:00Z', '2026-10-14', '2026-10-14T10:00:00', '', undefined,
    '2026-10-14T24:00:00Z', '2026-10-14T08:00:00+02:60', 'infinity'])('rejects invalid timestamp %s', (value) => {
    expect(() => readTimestamp(value)).toThrow();
  });
  it.each([NaN, Infinity, 0.5, 9000000000000000])('rejects invalid milliseconds %s', (value) => {
    expect(() => writeTimestamp(value)).toThrow();
  });
  it('distinguishes repeated clock times by their explicit offsets', () => {
    expect(readTimestamp('2026-10-25T02:30:00+01:00') - readTimestamp('2026-10-25T02:30:00+02:00')).toBe(3600000);
  });
});

describe('Supabase survey mapping', () => {
  it('sorts independent questions and options without changing raw rows', () => {
    const detail = mapSurveyDetail(SURVEY, CATEGORY, [...QUESTIONS].reverse(), [...OPTIONS].reverse());
    expect(detail.questions.map((q) => q.allowsMultipleAnswers)).toEqual([false, true]);
    expect(detail.questions[1].options.map((o) => o.position)).toEqual([0, 1]);
    expect(detail.createdAt).toBe(1791965812462);
    expect(detail.description).toBeNull();
    expect(detail.endsAt).toBeNull();
    expect(detail.questions[0].options[0]).not.toBe(OPTIONS[0]);
    expect(OPTIONS[0].position).toBe(0);
  });
  it('rejects foreign parents, duplicate positions and missing children', () => {
    expect(() => mapSurveyDetail(SURVEY, { ...CATEGORY, id: SURVEY.id }, QUESTIONS, OPTIONS)).toThrow();
    expect(() => mapSurveyDetail(SURVEY, CATEGORY, [{ ...QUESTIONS[0], survey_id: CATEGORY.id }], OPTIONS)).toThrow();
    expect(() => mapSurveyDetail(SURVEY, CATEGORY, QUESTIONS, [{ ...OPTIONS[0], question_id: CATEGORY.id }])).toThrow();
    expect(() => mapSurveyDetail(SURVEY, CATEGORY, [QUESTIONS[0], { ...QUESTIONS[1], position: 0 }], OPTIONS)).toThrow();
    expect(() => mapSurveyDetail(SURVEY, CATEGORY, QUESTIONS, [...OPTIONS, OPTIONS[0]])).toThrow();
    expect(() => mapSurveyDetail(SURVEY, CATEGORY, [], [])).toThrow();
    expect(() => mapSurveyDetail(SURVEY, CATEGORY, QUESTIONS, OPTIONS.slice(1))).toThrow();
  });
  it('rejects malformed rows rather than coercing them', () => {
    expect(() => mapSurvey(null)).toThrow();
    expect(() => mapSurvey({ ...SURVEY, id: 'invalid' })).toThrow();
    expect(() => mapSurvey({ ...SURVEY, title: '  ' })).toThrow();
    expect(() => mapSurvey({ ...SURVEY, description: undefined })).toThrow();
    expect(() => mapQuestion({ ...QUESTIONS[0], allows_multiple_answers: 'false' })).toThrow();
    expect(() => mapOption({ ...OPTIONS[0], vote_count: -1 })).toThrow();
    expect(() => mapOption({ ...OPTIONS[0], position: 0.5 })).toThrow();
    expect(() => mapOption({ ...OPTIONS[0], vote_count: '2' })).toThrow();
  });
});