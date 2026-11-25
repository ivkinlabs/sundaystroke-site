import { describe, expect, it } from 'vitest';
import { plan } from './plan.ts';
import type { PlanFacts } from './types.ts';

const quiet: Omit<PlanFacts, 'today'> = {
  issueState: 'none',
  candidatesCollected: false,
  checkerConfirmedNothing: false,
  publishedIssues: 1,
  reportSent: false,
};

const at = (date: string, weekday: number, hour: number, facts: Partial<PlanFacts> = {}): PlanFacts => ({
  ...quiet,
  ...facts,
  today: { date, weekday, hour },
});

describe('plan', () => {
  it('collects, writes, checks and opens the pull request in the one Sunday morning start', () => {
    expect(plan(at('2026-11-22', 0, 8))).toEqual({ issueDate: '2026-11-22', steps: ['find', 'write', 'check', 'open-pr'] });
  });

  it('only collects stories on Friday', () => {
    expect(plan(at('2026-11-13', 5, 8))).toEqual({ issueDate: '2026-11-15', steps: ['find'] });
  });

  it('writes from stories already collected without collecting again', () => {
    expect(plan(at('2026-11-14', 6, 8, { candidatesCollected: true })).steps).toEqual(['write', 'check', 'open-pr']);
  });

  it('never merges: an open or merged pull request leaves nothing to do', () => {
    expect(plan(at('2026-11-15', 0, 8, { issueState: 'open-pr' })).steps).toEqual([]);
    expect(plan(at('2026-11-16', 1, 8, { issueState: 'open-pr' })).steps).toEqual([]);
    expect(plan(at('2026-11-15', 0, 15, { issueState: 'merged' })).steps).toEqual([]);
  });

  it('leaves nothing to do once the checker confirmed no story this week', () => {
    expect(plan(at('2026-11-29', 0, 9, { candidatesCollected: true, checkerConfirmedNothing: true })).steps).toEqual([]);
  });

  it('never writes an issue for a Sunday already past', () => {
    expect(plan(at('2026-11-16', 1, 8))).toEqual({ issueDate: '2026-11-15', steps: [] });
  });

  it('never works on Sundays before the first automated issue', () => {
    expect(plan(at('2026-11-08', 0, 9))).toEqual({ issueDate: '2026-11-08', steps: [] });
  });

  it('reports the pilot once four issues are published', () => {
    expect(plan(at('2026-11-30', 1, 8, { issueState: 'merged', publishedIssues: 4 })).steps).toEqual(['report']);
    expect(plan(at('2026-11-30', 1, 15, { issueState: 'merged', publishedIssues: 4, reportSent: true })).steps).toEqual([]);
  });
});
