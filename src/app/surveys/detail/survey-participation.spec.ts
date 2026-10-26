import { SurveyParticipation } from './survey-participation';

describe('Browser-local participation', (): void => {
  it('persists completed participation without saving answer choices', (): void => {
    const participation: SurveyParticipation = new SurveyParticipation();
    expect(participation.hasCompleted('survey')).toBe(false);
    participation.complete('survey');
    expect(new SurveyParticipation().hasCompleted('survey')).toBe(true);
    expect(new SurveyParticipation().hasCompleted('other')).toBe(false);
    expect(localStorage.getItem('poll_app_completed_survey')).toBe('true');
  });

  it('keeps completion in memory when browser storage is unavailable', (): void => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation((): never => { throw new Error('Denied'); });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((): never => { throw new Error('Denied'); });
    const participation: SurveyParticipation = new SurveyParticipation();
    expect(participation.hasCompleted('survey')).toBe(false);
    participation.complete('survey');
    expect(participation.hasCompleted('survey')).toBe(true);
    get.mockRestore();
    set.mockRestore();
  });
});
