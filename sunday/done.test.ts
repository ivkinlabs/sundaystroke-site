import { describe, expect, it } from 'vitest';
import { doneMessage, stepsStillDue } from './done.ts';
import { plan } from './plan.ts';
import type { IssueProgress, PlanFacts } from './types.ts';

const sundayMorning: PlanFacts = {
  today: { date: '2026-11-29', weekday: 0, hour: 9 },
  issueState: 'none',
  candidatesCollected: true,
  checkerConfirmedNothing: false,
  publishedIssues: 2,
  reportSent: false,
};

const nothingYet: IssueProgress = { checked: false };

const due = (facts: Partial<PlanFacts>, progress: Partial<IssueProgress> = {}): readonly string[] =>
  stepsStillDue(plan({ ...sundayMorning, ...facts }), { ...nothingYet, ...progress });

describe('stepsStillDue', () => {
  it('passes once the pull request is open', () => {
    expect(due({ issueState: 'open-pr' }, { checked: true })).toEqual([]);
  });

  it('passes once the issue is merged', () => {
    expect(due({ issueState: 'merged' })).toEqual([]);
  });

  it('passes when the checker confirmed no story this week', () => {
    expect(due({ checkerConfirmedNothing: true })).toEqual([]);
  });

  it('passes when it is not time yet', () => {
    expect(due({ today: { date: '2026-11-25', weekday: 3, hour: 9 }, candidatesCollected: false })).toEqual([]);
  });

  it('fails a run that stopped after write', () => {
    expect(due({})).toEqual(['write', 'check', 'open-pr']);
  });

  it('fails a run that stopped after check', () => {
    expect(due({}, { checked: true })).toEqual(['open-pr']);
  });

  it('fails a run that stopped before collecting the stories', () => {
    expect(due({ candidatesCollected: false })).toEqual(['find', 'write', 'check', 'open-pr']);
  });

  it('fails while the pilot report is due', () => {
    expect(due({ today: { date: '2026-12-21', weekday: 1, hour: 9 }, issueState: 'merged', publishedIssues: 4 })).toEqual(['report']);
  });
});

describe('doneMessage', () => {
  it('names the issue date and the steps still due', () => {
    expect(doneMessage('2026-11-29', ['check', 'open-pr'])).toBe('the Sunday post for 2026-11-29 stopped before it finished; still due: check, open-pr');
  });

  it('says nothing is due', () => {
    expect(doneMessage('2026-11-29', [])).toBe('the Sunday post for 2026-11-29 has nothing due');
  });
});
