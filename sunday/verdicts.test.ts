import { describe, expect, it } from 'vitest';
import { ISSUE_TWO } from './testIssue.ts';
import type { ItemVerdict } from './types.ts';
import { applyVerdicts, parseVerdicts } from './verdicts.ts';

const GOLF = 'https://www.bbc.co.uk/sport/golf/1';
const DISC = 'https://www.pdga.com/news/1';

const reply = (verdicts: readonly ItemVerdict[], issueDate: string = '2026-11-15'): string => JSON.stringify({ issueDate, verdicts });
const confirmed = (sourceUrl: string): ItemVerdict => ({ sourceUrl, verdict: 'confirmed', reason: 'matches the page' });
const rejected = (sourceUrl: string): ItemVerdict => ({ sourceUrl, verdict: 'rejected', reason: 'the source says 2028' });

describe('parseVerdicts', () => {
  it('accepts one verdict for every item', () => {
    expect(parseVerdicts(reply([confirmed(GOLF), rejected(DISC)]), ISSUE_TWO)).toHaveLength(2);
  });

  it('refuses a check that skipped an item', () => {
    expect(() => parseVerdicts(reply([confirmed(GOLF)]), ISSUE_TWO)).toThrow(/no verdict/);
  });

  it('refuses two verdicts for one item, so a later "confirmed" cannot override a "rejected"', () => {
    expect(() => parseVerdicts(reply([rejected(GOLF), confirmed(GOLF), confirmed(DISC)]), ISSUE_TWO)).toThrow(/twice/);
  });

  it('refuses verdicts for items the issue does not have, or for another week', () => {
    expect(() => parseVerdicts(reply([confirmed(GOLF), confirmed(DISC), confirmed('https://golf.com/x/')]), ISSUE_TWO)).toThrow(/doesn't have/);
    expect(() => parseVerdicts(reply([confirmed(GOLF), confirmed(DISC)], '2026-11-08'), ISSUE_TWO)).toThrow(/2026-11-08/);
  });

  it('refuses unknown verdicts and extra fields', () => {
    expect(() => parseVerdicts(JSON.stringify({ issueDate: '2026-11-15', verdicts: [{ ...confirmed(GOLF), verdict: 'maybe' }, confirmed(DISC)] }), ISSUE_TWO)).toThrow();
    expect(() => parseVerdicts(JSON.stringify({ issueDate: '2026-11-15', verdicts: [{ ...confirmed(GOLF), note: 'x' }, confirmed(DISC)] }), ISSUE_TWO)).toThrow();
  });
});

describe('applyVerdicts', () => {
  it('drops rejected items and empty sections', () => {
    const checked = applyVerdicts(ISSUE_TWO, [confirmed(GOLF), rejected(DISC)]);
    expect(checked.issue.sections.map((section) => section.key)).toEqual(['golf']);
    expect(checked.rejected.map((verdict) => verdict.reason)).toEqual(['the source says 2028']);
  });

  it('refuses to publish when nothing was confirmed', () => {
    expect(() => applyVerdicts(ISSUE_TWO, [rejected(GOLF), rejected(DISC)])).toThrow(/no item/);
  });
});
