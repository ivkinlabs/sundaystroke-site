import { describe, expect, it } from 'vitest';
import { ISSUE_TWO } from './testIssue.ts';
import { applyVerdicts, parseVerdicts } from './verdicts.ts';

const GOLF = 'https://www.bbc.co.uk/sport/golf/1';
const DISC = 'https://www.pdga.com/news/1';

describe('applyVerdicts', () => {
  it('drops rejected items and empty sections', () => {
    const checked = applyVerdicts(ISSUE_TWO, {
      issueDate: '2026-11-15',
      verdicts: [
        { sourceUrl: GOLF, verdict: 'confirmed', reason: 'matches' },
        { sourceUrl: DISC, verdict: 'rejected', reason: 'the source says 2028' },
      ],
    });
    expect(checked.issue.sections.map((section) => section.key)).toEqual(['golf']);
    expect(checked.rejected.map((verdict) => verdict.reason)).toEqual(['the source says 2028']);
  });

  it('refuses a check that skipped an item', () => {
    expect(() => applyVerdicts(ISSUE_TWO, { issueDate: '2026-11-15', verdicts: [{ sourceUrl: GOLF, verdict: 'confirmed', reason: 'ok' }] })).toThrow(/no verdict/);
  });

  it('refuses to publish when nothing was confirmed', () => {
    const verdicts = [GOLF, DISC].map((sourceUrl) => ({ sourceUrl, verdict: 'rejected' as const, reason: 'wrong' }));
    expect(() => applyVerdicts(ISSUE_TWO, { issueDate: '2026-11-15', verdicts })).toThrow(/no item/);
  });

  it('parses the checker file strictly', () => {
    expect(parseVerdicts(JSON.stringify({ issueDate: '2026-11-15', verdicts: [{ sourceUrl: GOLF, verdict: 'confirmed', reason: 'ok' }] })).verdicts).toHaveLength(1);
    expect(() => parseVerdicts(JSON.stringify({ issueDate: '2026-11-15', verdicts: [{ sourceUrl: GOLF, verdict: 'maybe', reason: 'ok' }] }))).toThrow();
  });
});
