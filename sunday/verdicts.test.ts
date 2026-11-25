import { describe, expect, it } from 'vitest';
import { ISSUE_TWO } from './testIssue.ts';
import type { ItemVerdict } from './types.ts';
import { applyVerdicts, confirmsNothing, parseVerdicts, withoutItems } from './verdicts.ts';

const GOLF = 'https://www.bbc.co.uk/sport/golf/1';
const DISC = 'https://www.pdga.com/news/1';

const NOTE = { verdict: 'confirmed', reason: 'every fact is on a kept page' };
const reply = (verdicts: readonly ItemVerdict[], issueDate: string = '2026-11-15'): string => JSON.stringify({ issueDate, editorNote: NOTE, verdicts });
const confirmed = (sourceUrl: string): ItemVerdict => ({ sourceUrl, verdict: 'confirmed', reason: 'matches the page' });
const rejected = (sourceUrl: string): ItemVerdict => ({ sourceUrl, verdict: 'rejected', reason: 'the source says 2028' });

describe('parseVerdicts', () => {
  it('accepts one verdict for every item', () => {
    const check = parseVerdicts(reply([confirmed(GOLF), rejected(DISC)]), ISSUE_TWO);
    expect(check.verdicts).toHaveLength(2);
    expect(check.editorNote).toEqual(NOTE);
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

  it('refuses a check that gave no verdict on the editor\'s note', () => {
    expect(() => parseVerdicts(JSON.stringify({ issueDate: '2026-11-15', verdicts: [confirmed(GOLF), confirmed(DISC)] }), ISSUE_TWO)).toThrow(/editorNote/);
    expect(() => parseVerdicts(JSON.stringify({ issueDate: '2026-11-15', editorNote: { verdict: 'maybe', reason: 'x' }, verdicts: [confirmed(GOLF), confirmed(DISC)] }), ISSUE_TWO)).toThrow(/editorNote/);
  });

  it('refuses unknown verdicts and extra fields', () => {
    expect(() => parseVerdicts(JSON.stringify({ issueDate: '2026-11-15', editorNote: NOTE, verdicts: [{ ...confirmed(GOLF), verdict: 'maybe' }, confirmed(DISC)] }), ISSUE_TWO)).toThrow();
    expect(() => parseVerdicts(JSON.stringify({ issueDate: '2026-11-15', editorNote: NOTE, verdicts: [{ ...confirmed(GOLF), note: 'x' }, confirmed(DISC)] }), ISSUE_TWO)).toThrow();
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

describe('withoutItems', () => {
  it('leaves only the live stories for the checker, and nothing when every link is dead', () => {
    expect(withoutItems(ISSUE_TWO, [rejected(DISC)]).sections.map((section) => section.key)).toEqual(['golf']);
    expect(withoutItems(ISSUE_TWO, [rejected(GOLF), rejected(DISC)]).sections).toEqual([]);
  });
});

describe('confirmsNothing', () => {
  it('is true only when every item was rejected', () => {
    expect(confirmsNothing([rejected(GOLF), rejected(DISC)])).toBe(true);
    expect(confirmsNothing([confirmed(GOLF), rejected(DISC)])).toBe(false);
  });
});
