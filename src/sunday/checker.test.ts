import { describe, expect, it } from 'vitest';
import { checkerPrompt, replyJson } from './checker.ts';
import { pullBody } from './pullBody.ts';
import { ISSUE_TWO, candidatesFor } from './testIssue.ts';

describe('the source check', () => {
  it('gives the checker the issue and only the stories it uses, after its instructions', () => {
    const candidates = candidatesFor(ISSUE_TWO);
    const extra = { ...candidates.candidates[0], link: 'https://golf.com/unused/', title: 'Unused story' };
    const prompt = checkerPrompt('CHECK THESE', ISSUE_TWO, { ...candidates, candidates: [...candidates.candidates, extra] });
    expect(prompt.startsWith('CHECK THESE')).toBe(true);
    expect(prompt).toContain(ISSUE_TWO.sections[0]?.items[0]?.sourceUrl);
    expect(prompt).not.toContain('Unused story');
  });

  it('reads the verdicts from a bare or fenced final message', () => {
    expect(replyJson('  {"a":1}\n')).toBe('{"a":1}');
    expect(replyJson('Checked.\n```json\n{"a":1}\n```\n')).toBe('{"a":1}');
  });

  it('lists kept and rejected items in the pull request', () => {
    const body = pullBody(ISSUE_TWO, {
      issueDate: '2026-11-15',
      issueHash: 'h',
      checkedAt: '2026-11-14T08:00:00Z',
      verdicts: [
        { sourceUrl: 'https://www.bbc.co.uk/sport/golf/1', verdict: 'confirmed', reason: 'matches' },
        { sourceUrl: 'https://www.pdga.com/news/1', verdict: 'rejected', reason: 'wrong year' },
      ],
    });
    expect(body).toContain('## Kept (1)\n- https://www.bbc.co.uk/sport/golf/1: matches');
    expect(body).toContain('## Rejected by the check (1)\n- https://www.pdga.com/news/1: wrong year');
  });
});
