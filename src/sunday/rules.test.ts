import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { issueProblems, sentenceCount } from './rules.ts';
import { ISSUE_TWO, candidatesFor } from './testIssue.ts';
import type { RuleContext } from './rules.ts';
import type { CandidateFile } from './types.ts';
import type { SundayIssue, SundaySection } from '../types/sunday.ts';
import { SUNDAY_ISSUES } from '../data/sunday.ts';

const mediaExists = (sitePath: string): boolean => existsSync(join(process.cwd(), 'public', sitePath));
const issueOne = SUNDAY_ISSUES[0];
if (issueOne === undefined) throw new Error('issue 1 is missing');

function context(candidates: CandidateFile = candidatesFor(ISSUE_TWO)): RuleContext {
  return { earlierIssues: [issueOne], candidates, mediaExists };
}

function withGolf(changes: Partial<SundaySection>): SundayIssue {
  const [golf, tracer] = ISSUE_TWO.sections;
  if (golf === undefined || tracer === undefined) throw new Error('fixture sections missing');
  return { ...ISSUE_TWO, sections: [{ ...golf, ...changes }, tracer] };
}

describe('issueProblems', () => {
  it('accepts an issue that follows the rules', () => {
    expect(issueProblems(ISSUE_TWO, context())).toEqual([]);
  });

  it('accepts a thin week with a single story', () => {
    const thin = { ...ISSUE_TWO, sections: ISSUE_TWO.sections.slice(0, 1) };
    expect(issueProblems(thin, context())).toEqual([]);
  });

  it('rejects disc golf in the Golf section or the lead', () => {
    const golfItem = { headline: 'Discs', body: 'A disc golf story.', sourceLabel: 'BBC Sport', sourceUrl: 'https://www.bbc.co.uk/sport/golf/1' };
    expect(issueProblems(withGolf({ items: [golfItem] }), context())).toContain('disc golf is named in the Golf section');
    expect(issueProblems({ ...ISSUE_TWO, leadText: 'Disc golf this week.' }, context())).toContain('disc golf is named outside the Tracer section');
  });

  it('rejects a story that is not among the stories collected this week', () => {
    const stale = { ...candidatesFor(ISSUE_TWO), candidates: candidatesFor(ISSUE_TWO).candidates.slice(1) };
    expect(issueProblems(ISSUE_TWO, context(stale)).join()).toContain("not one of this week's collected stories");
  });

  it('rejects a golf source in the Tracer section and a wrong credit', () => {
    const candidates = candidatesFor(ISSUE_TWO);
    const moved = { ...candidates, candidates: candidates.candidates.map((candidate) => ({ ...candidate, section: 'golf' as const, sourceName: 'GOLF.com' })) };
    const problems = issueProblems(ISSUE_TWO, context(moved)).join('\n');
    expect(problems).toContain('belongs in the golf section');
    expect(problems).toContain('must credit "GOLF.com"');
  });

  it('rejects more than two sentences, more than five items and a repeated source', () => {
    const item = { headline: 'Long', body: 'One. Two. Three.', sourceLabel: 'BBC Sport', sourceUrl: 'https://www.bbc.co.uk/sport/golf/1' };
    expect(issueProblems(withGolf({ items: [item] }), context()).join()).toContain('3 sentences');
    const six = withGolf({ items: Array.from({ length: 5 }, () => ({ ...item, body: 'One.' })) });
    const problems = issueProblems(six, context()).join('\n');
    expect(problems).toContain('6 items');
    expect(problems).toContain('repeats a source');
  });

  it('rejects a wrong number, date or title, an existing date and media that is not ours', () => {
    const wrong = { ...ISSUE_TWO, number: 3, date: 'Sunday 15 Nov 2026', leadClips: [{ src: 'https://example.com/a.mp4', poster: '/media/none.jpg', label: 'x' }] };
    const problems = issueProblems(wrong, context()).join('\n');
    expect(problems).toContain('number must be 2');
    expect(problems).toContain('date must read "Sunday 15 November 2026"');
    expect(problems).toContain('not one of the site\'s own files');
    const again = { ...issueOne };
    expect(issueProblems(again, { ...context(candidatesFor(issueOne)) }).join()).toContain('already exists');
  });

  it('counts sentences without splitting on common abbreviations', () => {
    expect(sentenceCount('Dr. Smith won in the U.S. on Sunday.')).toBe(1);
    expect(sentenceCount('He won. She was second!')).toBe(2);
  });
});

describe('every published issue', () => {
  it('follows the rules against the issues before it', () => {
    SUNDAY_ISSUES.forEach((issue, at) => {
      const problems = issueProblems(issue, { earlierIssues: SUNDAY_ISSUES.slice(0, at), candidates: candidatesFor(issue), mediaExists });
      expect(problems, issue.slug).toEqual([]);
    });
  });
});
