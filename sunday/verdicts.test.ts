import { describe, expect, it } from 'vitest';
import { ISSUE_TWO } from './testIssue.ts';
import type { ItemVerdict } from './types.ts';
import { applyVerdicts, confirmsNothing, itemUrls, parseVerdicts, withoutItems } from './verdicts.ts';

const LEAD = 'https://www.skysports.com/golf/news/1';
const GOLF = 'https://www.bbc.co.uk/sport/golf/1';
const DISC = 'https://www.pdga.com/news/1';
const HITS = ['https://www.golfmonthly.com/news/1', 'https://www.nationalclubgolfer.com/news/1', 'https://www.espn.com/golf/story/1'];
const TIP = 'https://golf.com/instruction/rules/1';

const NOTE = { verdict: 'confirmed', reason: 'every fact is on a kept page' };
const WEEK = { verdict: 'confirmed', reason: 'the dates and venue are on the schedule' };
const reply = (verdicts: readonly unknown[], issueDate: string = '2026-11-15', editorNote: unknown = NOTE, thisWeek: unknown = WEEK): string =>
  JSON.stringify({ issueDate, editorNote, thisWeek, verdicts });
const confirmed = (sourceUrl: string): ItemVerdict => ({ sourceUrl, verdict: 'confirmed', reason: 'matches the page' });
const rejected = (sourceUrl: string): ItemVerdict => ({ sourceUrl, verdict: 'rejected', reason: 'the source says 2028' });
const allConfirmed = (except: readonly string[] = []): ItemVerdict[] => itemUrls(ISSUE_TWO).filter((url) => !except.includes(url)).map(confirmed);

describe('itemUrls', () => {
  it('lists the lead, every card, every quick hit and the Sunday round tip', () => {
    expect(itemUrls(ISSUE_TWO)).toEqual([LEAD, GOLF, DISC, ...HITS, TIP]);
  });
});

describe('parseVerdicts', () => {
  it('accepts one verdict for every item and a verdict on the note and the This week box', () => {
    const check = parseVerdicts(reply([...allConfirmed([DISC]), rejected(DISC)]), ISSUE_TWO);
    expect(check.verdicts).toHaveLength(7);
    expect(check.editorNote).toEqual(NOTE);
    expect(check.thisWeek).toEqual(WEEK);
  });

  it('refuses a check that skipped an item, a quick hit or the tip', () => {
    expect(() => parseVerdicts(reply(allConfirmed([GOLF])), ISSUE_TWO)).toThrow(/no verdict/);
    expect(() => parseVerdicts(reply(allConfirmed([HITS[1] ?? ''])), ISSUE_TWO)).toThrow(/no verdict/);
    expect(() => parseVerdicts(reply(allConfirmed([TIP])), ISSUE_TWO)).toThrow(/no verdict/);
  });

  it('refuses two verdicts for one item, so a later "confirmed" cannot override a "rejected"', () => {
    expect(() => parseVerdicts(reply([rejected(GOLF), ...allConfirmed()]), ISSUE_TWO)).toThrow(/twice/);
  });

  it('refuses verdicts for items the issue does not have, or for another week', () => {
    expect(() => parseVerdicts(reply([...allConfirmed(), confirmed('https://golf.com/x/')]), ISSUE_TWO)).toThrow(/doesn't have/);
    expect(() => parseVerdicts(reply(allConfirmed(), '2026-11-08'), ISSUE_TWO)).toThrow(/2026-11-08/);
  });

  it('refuses a check that gave no verdict on the editor\'s note or the This week box', () => {
    expect(() => parseVerdicts(JSON.stringify({ issueDate: '2026-11-15', thisWeek: WEEK, verdicts: allConfirmed() }), ISSUE_TWO)).toThrow(/editorNote/);
    expect(() => parseVerdicts(reply(allConfirmed(), '2026-11-15', { verdict: 'maybe', reason: 'x' }), ISSUE_TWO)).toThrow(/editorNote/);
    expect(() => parseVerdicts(JSON.stringify({ issueDate: '2026-11-15', editorNote: NOTE, verdicts: allConfirmed() }), ISSUE_TWO)).toThrow(/thisWeek/);
  });

  it('refuses unknown verdicts and extra fields', () => {
    expect(() => parseVerdicts(reply([{ ...confirmed(GOLF), verdict: 'maybe' }, ...allConfirmed([GOLF])]), ISSUE_TWO)).toThrow();
    expect(() => parseVerdicts(reply([{ ...confirmed(GOLF), note: 'x' }, ...allConfirmed([GOLF])]), ISSUE_TWO)).toThrow();
  });
});

describe('applyVerdicts', () => {
  it('drops rejected cards and quick hits and empty sections', () => {
    const extraHit = { text: 'One more quick hit for the week.', sourceLabel: 'BBC Sport', sourceUrl: 'https://www.bbc.co.uk/sport/golf/2' };
    const four = { ...ISSUE_TWO, quickHits: [...ISSUE_TWO.quickHits, extraHit] };
    const checked = applyVerdicts(four, [...allConfirmed([DISC, HITS[0] ?? '']), rejected(DISC), rejected(HITS[0] ?? ''), confirmed(extraHit.sourceUrl)]);
    expect(checked.issue.sections.map((section) => section.key)).toEqual(['golf']);
    expect(checked.issue.quickHits.map((hit) => hit.sourceUrl)).toEqual([HITS[1], HITS[2], extraHit.sourceUrl]);
    expect(checked.rejected.map((verdict) => verdict.sourceUrl)).toEqual([DISC, HITS[0]]);
  });

  it('stops when the lead story or the Sunday round tip is rejected', () => {
    expect(() => applyVerdicts(ISSUE_TWO, [...allConfirmed([LEAD]), rejected(LEAD)])).toThrow(/rejected the lead story: the source says 2028/);
    expect(() => applyVerdicts(ISSUE_TWO, [...allConfirmed([TIP]), rejected(TIP)])).toThrow(/rejected the Sunday round tip/);
  });

  it('stops when fewer than three quick hits survive', () => {
    expect(() => applyVerdicts(ISSUE_TWO, [...allConfirmed([HITS[0] ?? '']), rejected(HITS[0] ?? '')])).toThrow(/2 quick hits/);
  });

  it('refuses to publish when nothing was confirmed', () => {
    expect(() => applyVerdicts(ISSUE_TWO, itemUrls(ISSUE_TWO).map(rejected))).toThrow(/no item/);
  });
});

describe('withoutItems', () => {
  it('leaves only the live stories for the checker, and nothing when every link is dead', () => {
    const live = withoutItems(ISSUE_TWO, [rejected(DISC), rejected(LEAD), rejected(TIP), rejected(HITS[0] ?? '')]);
    expect(live.sections.map((section) => section.key)).toEqual(['golf']);
    expect(live.lead).toBeNull();
    expect(live.sundayRound).toBeNull();
    expect(live.quickHits).toHaveLength(2);
    expect(itemUrls(withoutItems(ISSUE_TWO, itemUrls(ISSUE_TWO).map(rejected)))).toEqual([]);
  });
});

describe('confirmsNothing', () => {
  it('is true only when every item was rejected', () => {
    expect(confirmsNothing([rejected(GOLF), rejected(DISC)])).toBe(true);
    expect(confirmsNothing([confirmed(GOLF), rejected(DISC)])).toBe(false);
  });
});
