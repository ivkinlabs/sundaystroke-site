import { describe, expect, it } from 'vitest';
import { plan } from './plan.ts';
import type { PlanFacts } from './types.ts';

const quiet: Omit<PlanFacts, 'today'> = {
  issueLive: false,
  candidatesCollectedOn: null,
  pullOpen: false,
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

  it('refreshes the stories, writes, checks and opens the pull request on Saturday', () => {
    expect(plan(at('2026-11-14', 6, 8, { candidatesCollectedOn: '2026-11-13' })).steps).toEqual(['find', 'write', 'check', 'open-pr']);
  });

  it('publishes the open pull request on Sunday morning', () => {
    expect(plan(at('2026-11-15', 0, 8, { pullOpen: true })).steps).toEqual(['publish']);
  });

  it('waits for the morning before publishing on Sunday', () => {
    expect(plan(at('2026-11-15', 0, 7, { pullOpen: true })).steps).toEqual([]);
  });

  it('catches up on a Sunday whose Friday and Saturday runs were missed', () => {
    expect(plan(at('2026-11-15', 0, 9)).steps).toEqual(['find', 'write', 'check', 'open-pr', 'publish']);
  });

  it('does nothing once the issue is live', () => {
    expect(plan(at('2026-11-15', 0, 15, { issueLive: true })).steps).toEqual([]);
  });

  it('alerts once on a weekday when last Sunday has no issue', () => {
    expect(plan(at('2026-11-16', 1, 8))).toEqual({ issueDate: '2026-11-15', steps: ['alert-missed'] });
    expect(plan(at('2026-11-17', 2, 8, { missedAlerted: true })).steps).toEqual([]);
    expect(plan(at('2026-11-16', 1, 8, { issueLive: true })).steps).toEqual([]);
  });

  it('reports the pilot once four issues are live', () => {
    expect(plan(at('2026-11-30', 1, 8, { issueLive: true, publishedIssues: 4 })).steps).toEqual(['report']);
    expect(plan(at('2026-12-01', 2, 8, { issueLive: true, publishedIssues: 4, reportSent: true })).steps).toEqual([]);
  });
});
