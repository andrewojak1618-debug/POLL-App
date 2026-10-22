import { describe, expect, it } from 'vitest';
import { formatSurveyDeadline } from './survey_deadline';

const NOW: number = 1000000;
const DAY: number = 86400000;

describe('survey deadline labels', () => {
  it('shows an unlimited deadline', () => {
    expect(formatSurveyDeadline(null, NOW)).toBe('No deadline');
  });
  it('treats the exact deadline and earlier dates as ended', () => {
    expect(formatSurveyDeadline(NOW, NOW)).toBe('Ended');
    expect(formatSurveyDeadline(NOW - 1, NOW)).toBe('Ended');
  });
  it('rounds positive remaining time up without showing zero days', () => {
    expect(formatSurveyDeadline(NOW + 1, NOW)).toBe('Ends in 1 Day');
    expect(formatSurveyDeadline(NOW + DAY, NOW)).toBe('Ends in 1 Day');
    expect(formatSurveyDeadline(NOW + DAY + 1, NOW)).toBe('Ends in 2 Days');
  });
  it('updates the label as time crosses day and expiry boundaries', () => {
    const deadline: number = NOW + 2 * DAY;
    expect(formatSurveyDeadline(deadline, NOW)).toBe('Ends in 2 Days');
    expect(formatSurveyDeadline(deadline, NOW + DAY)).toBe('Ends in 1 Day');
    expect(formatSurveyDeadline(deadline, deadline)).toBe('Ended');
  });
});