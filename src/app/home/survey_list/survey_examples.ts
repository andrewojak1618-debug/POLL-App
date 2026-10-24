import type { SurveyListItem } from './survey_list_item';

const DAY_IN_MS: number = 24 * 60 * 60 * 1000;

/** Erstellt relative Beispieldaten, damit Tests unabhängig vom tatsächlichen Kalenderdatum bleiben.
 * @param now - Bezugszeitpunkt in Millisekunden.
 * @returns Laufende und abgelaufene Beispielumfragen.
 */
export function createSurveyExamples(now: number): readonly SurveyListItem[] {
  return [
    { id: 'team-1', category: 'Team Activities', title: 'Let’s Plan the Next Team Event Together', deadlineLabel: 'Ends in 1 Day', endsAt: now + DAY_IN_MS },
    { id: 'gaming-1', category: 'Gaming & Entertainment', title: 'Gaming habits and favorite games!', deadlineLabel: 'Ends in 3 Days', endsAt: now + 3 * DAY_IN_MS },
    { id: 'health-1', category: 'Health & Wellness', title: 'Healthier future: Fit & wellness survey!', deadlineLabel: 'Ends in 2 Days', endsAt: now + 2 * DAY_IN_MS },
    { id: 'education-1', category: 'Education & Learning', title: 'What would you like to learn next?', deadlineLabel: 'Ends in 4 Days', endsAt: now + 4 * DAY_IN_MS },
    { id: 'lifestyle-1', category: 'Lifestyle & Preferences', title: 'Share your everyday favorites', deadlineLabel: 'Ends in 5 Days', endsAt: now + 5 * DAY_IN_MS },
    { id: 'technology-1', category: 'Technology & Innovation', title: 'Which tools should we try next?', deadlineLabel: 'Ends in 6 Days', endsAt: now + 6 * DAY_IN_MS },
    { id: 'team-2', category: 'Team Activities', title: 'Our previous team event', deadlineLabel: 'Ended', endsAt: now - DAY_IN_MS },
    { id: 'gaming-2', category: 'Gaming & Entertainment', title: 'Last month’s favorite games', deadlineLabel: 'Ended', endsAt: now - 3 * DAY_IN_MS },
    { id: 'health-2', category: 'Health & Wellness', title: 'Previous wellness survey', deadlineLabel: 'Ended', endsAt: now - 2 * DAY_IN_MS },
  ];
}
