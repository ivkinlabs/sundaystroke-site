import { describe, expect, it } from 'vitest';
import { ISSUE_TWO } from './testIssue.ts';
import type { ItemVerdict, NoteVerdict } from './types.ts';
import { applyVerdicts, confirmsNothing, parseCheckReply } from './verdicts.ts';

const GOLF = 'https://www.bbc.co.uk/sport/golf/1';
const DISC = 'https://www.pdga.com/news/1';
const NOTE_OK: NoteVerdict = { verdict: 'confirmed', reason: 'only claims from the kept stories' };
const NOTE_BAD: NoteVerdict = { verdict: 'rejected', reason: 'the note names a winner no story names' };

const reply = (verdicts: readonly ItemVerdict[], issueDate: string = '2026-11-15', note: NoteVerdict = NOTE_OK): string => JSON.stringify({ issueDate, note, verdicts });
const confirmed = (sourceUrl: string): ItemVerdict => ({ sourceUrl, verdict: 'confirmed', reason: 'matches the page' });
const rejected = (sourceUrl: string): ItemVerdict => ({ sourceUrl, verdict: 'rejected', reason: 'the source says 2028' });

describe('parseCheckReply', () => {
  it('accepts a verdict on the note and one for every item', () => {
    const parsed = parseCheckReply(reply([confirmed(GOLF), rejected(DISC)]), ISSUE_TWO);
    expect(parsed.verdicts).toHaveLength(2);
    expect(parsed.note).toEqual(NOTE_OK);
  });

  it("refuses a check without a verdict on the editor's note", () => {
    expect(() => parseCheckReply(JSON.stringify({ issueDate: '2026-11-15', verdicts: [confirmed(GOLF), confirmed(DISC)] }), ISSUE_TWO)).toThrow(/note/);
  });

  it('refuses a check that skipped an item', () => {
    expect(() => parseCheckReply(reply([confirmed(GOLF)]), ISSUE_TWO)).toThrow(/no verdict/);
  });

  it('refuses two verdicts for one item, so a later "confirmed" cannot override a "rejected"', () => {
    expect(() => parseCheckReply(reply([rejected(GOLF), confirmed(GOLF), confirmed(DISC)]), ISSUE_TWO)).toThrow(/twice/);
  });

  it('refuses verdicts for items the issue does not have, or for another week', () => {
    expect(() => parseCheckReply(reply([confirmed(GOLF), confirmed(DISC), confirmed('https://golf.com/x/')]), ISSUE_TWO)).toThrow(/doesn't have/);
    expect(() => parseCheckReply(reply([confirmed(GOLF), confirmed(DISC)], '2026-11-08'), ISSUE_TWO)).toThrow(/2026-11-08/);
  });

  it('refuses unknown verdicts and extra fields', () => {
    expect(() => parseCheckReply(reply([{ ...confirmed(GOLF), verdict: 'maybe' as 'confirmed' }, confirmed(DISC)]), ISSUE_TWO)).toThrow();
    expect(() => parseCheckReply(JSON.stringify({ issueDate: '2026-11-15', note: NOTE_OK, verdicts: [{ ...confirmed(GOLF), extra: 'x' }, confirmed(DISC)] }), ISSUE_TWO)).toThrow();
  });
});

describe('applyVerdicts', () => {
  it('drops rejected items and empty sections', () => {
    const checked = applyVerdicts(ISSUE_TWO, { note: NOTE_OK, verdicts: [confirmed(GOLF), rejected(DISC)] });
    expect(checked.issue.sections.map((section) => section.key)).toEqual(['golf']);
    expect(checked.rejected.map((verdict) => verdict.reason)).toEqual(['the source says 2028']);
  });

  it('refuses to publish when nothing was confirmed', () => {
    expect(() => applyVerdicts(ISSUE_TWO, { note: NOTE_OK, verdicts: [rejected(GOLF), rejected(DISC)] })).toThrow(/no item/);
  });

  it("refuses to publish an issue whose editor's note the check rejected", () => {
    expect(() => applyVerdicts(ISSUE_TWO, { note: NOTE_BAD, verdicts: [confirmed(GOLF), confirmed(DISC)] })).toThrow(/editor's note: the note names a winner/);
  });
});

describe('confirmsNothing', () => {
  it('is true only when every item was rejected', () => {
    expect(confirmsNothing([rejected(GOLF), rejected(DISC)])).toBe(true);
    expect(confirmsNothing([confirmed(GOLF), rejected(DISC)])).toBe(false);
  });
});
