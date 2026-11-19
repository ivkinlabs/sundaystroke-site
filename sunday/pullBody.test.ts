import { describe, expect, it } from 'vitest';
import { pullBody } from './pullBody.ts';
import { ISSUE_TWO } from './testIssue.ts';
import type { CheckRecord } from './types.ts';

const record: CheckRecord = {
  issueDate: ISSUE_TWO.slug,
  issueHash: 'hash',
  checkedAt: '2026-11-15T08:40:00.000Z',
  verdicts: [
    { sourceUrl: 'https://www.bbc.co.uk/sport/golf/1', verdict: 'confirmed', reason: 'the page says 63' },
    { sourceUrl: 'https://www.pdga.com/news/1', verdict: 'confirmed', reason: 'the dates are on the page' },
  ],
};

const FACT_CHECK: RegExp = /^```factory-fact-check\n([\s\S]*?)^```$/m;

describe('pullBody', () => {
  it('fact checks the issue file with one claim per story, sourced to the story', () => {
    const block = FACT_CHECK.exec(pullBody(ISSUE_TWO, record))?.[1];
    expect(block).toBeDefined();
    expect(JSON.parse(block ?? '')).toEqual([
      {
        page: 'src/data/sunday/2026-11-15.json',
        facts: [
          { part: 'text', claim: 'A final-round charge: Smith shot 63 to win by two. It was his first title.', source: 'https://www.bbc.co.uk/sport/golf/1' },
          { part: 'text', claim: 'Worlds move: The PDGA set new dates for Pro Worlds.', source: 'https://www.pdga.com/news/1' },
        ],
      },
    ]);
  });

  it('says the issue goes live only once the owner approves it', () => {
    expect(pullBody(ISSUE_TWO, record)).toContain('Goes live once the owner taps Publish on this exact issue.');
    expect(pullBody(ISSUE_TWO, record)).not.toContain('Merged on Sunday morning');
  });
});
