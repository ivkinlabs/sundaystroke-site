import { describe, expect, it } from 'vitest';
import { plan } from './plan.ts';
import type { PlanFacts } from './types.ts';

const quiet: Omit<PlanFacts, 'today'> = {
  issueState: 'none',
  candidatesCollected: false,
  announced: false,
  missedAlerted: false,
  publishedIssues: 1,
  reportSent: false,
};

const at = (date: string, weekday: number, hour: number, facts: Partial<PlanFacts> = {}): PlanFacts => ({
  ...quiet,
  ...facts,
  today: { date, weekday, hour },
});

describe('plan', () => {
  it('only collects stories on Friday', () => {
    expect(plan(at('2026-11-13', 5, 8))).toEqual({ issueDate: '2026-11-15', steps: ['find'] });
  });

  it('writes, checks and opens the pull request on Saturday from Friday\'s stories', () => {
    expect(plan(at('2026-11-14', 6, 8, { candidatesCollected: true })).steps).toEqual(['write', 'check', 'open-pr']);
  });

  it('leaves an open pull request alone until Sunday morning', () => {
    expect(plan(at('2026-11-14', 6, 15, { issueState: 'open-pr' })).steps).toEqual([]);
    expect(plan(at('2026-11-15', 0, 7, { issueState: 'open-pr' })).steps).toEqual([]);
    expect(plan(at('2026-11-15', 0, 8, { issueState: 'open-pr' })).steps).toEqual(['publish']);
  });

  it('catches up on a Sunday whose Friday and Saturday runs were missed', () => {
    expect(plan(at('2026-11-15', 0, 9)).steps).toEqual(['find', 'write', 'check', 'open-pr', 'publish']);
  });

  it('finishes a publish that merged but never confirmed, without rewriting the issue', () => {
    expect(plan(at('2026-11-15', 0, 15, { issueState: 'merged' })).steps).toEqual(['publish']);
    expect(plan(at('2026-11-16', 1, 8, { issueState: 'live' })).steps).toEqual(['publish']);
  });

  it('publishes a late pull request on Monday rather than skipping the week', () => {
    expect(plan(at('2026-11-16', 1, 8, { issueState: 'open-pr' })).steps).toEqual(['publish']);
  });

  it('does nothing once the issue is live and announced', () => {
    expect(plan(at('2026-11-15', 0, 15, { issueState: 'live', announced: true })).steps).toEqual([]);
  });

  it('alerts once on Monday when last Sunday has no issue', () => {
    expect(plan(at('2026-11-16', 1, 8))).toEqual({ issueDate: '2026-11-15', steps: ['alert-missed'] });
    expect(plan(at('2026-11-16', 1, 15, { missedAlerted: true })).steps).toEqual([]);
  });

  it('never works on or alerts for Sundays before the first automated issue', () => {
    expect(plan(at('2026-11-09', 1, 8))).toEqual({ issueDate: '2026-11-08', steps: [] });
    expect(plan(at('2026-11-08', 0, 9))).toEqual({ issueDate: '2026-11-08', steps: [] });
  });

  it('reports the pilot once four issues are published', () => {
    expect(plan(at('2026-11-30', 1, 8, { issueState: 'live', announced: true, publishedIssues: 4 })).steps).toEqual(['report']);
    expect(plan(at('2026-11-30', 1, 15, { issueState: 'live', announced: true, publishedIssues: 4, reportSent: true })).steps).toEqual([]);
  });
});
