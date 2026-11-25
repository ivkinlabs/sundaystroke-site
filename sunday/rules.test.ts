import { describe, expect, it } from 'vitest';
import { issueFileProblems, issueProblems, sentenceCount, shapeProblems } from './rules.ts';
import { ISSUE_TWO, candidatesFor } from './testIssue.ts';
import type { RuleContext } from './rules.ts';
import type { CandidateFile } from './types.ts';
import type { SundayIssue, SundaySection } from '../src/types/sunday.ts';
import { SUNDAY_ISSUES } from '../src/data/sunday.ts';

const issueOne = SUNDAY_ISSUES[0];
if (issueOne === undefined) throw new Error('issue 1 is missing');

function context(candidates: CandidateFile = candidatesFor(ISSUE_TWO)): RuleContext {
  return { earlierIssues: [issueOne], candidates };
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

  it('rejects disc golf in the Golf section or the summary', () => {
    const golfItem = { headline: 'Discs', body: 'A disc golf story.', sourceLabel: 'BBC Sport', sourceUrl: 'https://www.bbc.co.uk/sport/golf/1' };
    expect(issueProblems(withGolf({ items: [golfItem] }), context())).toContain('disc golf is named in the Golf section');
    expect(issueProblems({ ...ISSUE_TWO, summary: 'Disc golf this week.' }, context())).toContain('disc golf is named outside the Disc golf section');
  });

  it('fails an issue that names an app, a store or a download', () => {
    const story = (body: string): SundayIssue => withGolf({ items: [{ headline: 'A final-round charge', body, sourceLabel: 'BBC Sport', sourceUrl: 'https://www.bbc.co.uk/sport/golf/1' }] });
    expect(issueProblems(story('Smith won. Film your own swing with Tracer.'), context())).toContain('the copy names an app');
    expect(issueProblems(story('Smith won. Our Golf GPS app has the yardages.'), context())).toContain('the copy names an app');
    expect(issueProblems({ ...ISSUE_TWO, summary: 'Get it on the App Store.' }, context())).toContain('the copy names an app store');
    expect(issueProblems({ ...ISSUE_TWO, pageTitle: 'Download it free | SundayStroke' }, context())).toContain('the copy asks for a download');
    expect(issueProblems({ ...ISSUE_TWO, summary: 'Find it on the Play-Store.' }, context())).toContain('the copy names an app store');
    expect(issueProblems(story('Smith won. Golf-GPS has it.'), context())).toContain('the copy names an app');
    expect(issueProblems(story('Smith shot 63 to win by two, a happy approach to a title.'), context())).toEqual([]);
  });

  it('rejects a story that is not among the stories collected this week', () => {
    const stale = { ...candidatesFor(ISSUE_TWO), candidates: candidatesFor(ISSUE_TWO).candidates.slice(1) };
    expect(issueProblems(ISSUE_TWO, context(stale)).join()).toContain("not one of this week's collected stories");
  });

  it('rejects a golf source in the Disc golf section and a wrong credit', () => {
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

  it('rejects a wrong number, date or title and an existing date', () => {
    const wrong = { ...ISSUE_TWO, number: 3, date: 'Sunday 15 Nov 2026' };
    const problems = issueProblems(wrong, context()).join('\n');
    expect(problems).toContain('number must be 2');
    expect(problems).toContain('date must read "Sunday 15 November 2026"');
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
      const problems = issueProblems(issue, { earlierIssues: SUNDAY_ISSUES.slice(0, at), candidates: candidatesFor(issue) });
      expect(problems, issue.slug).toEqual([]);
    });
  });

  it('rejects a story published outside the seven days before the issue', () => {
    const base = candidatesFor(ISSUE_TWO);
    const stale = { ...base, candidates: base.candidates.map((candidate, at) => (at === 0 ? { ...candidate, published: '2026-11-07T10:00:00.000Z' } : candidate)) };
    const future = { ...base, candidates: base.candidates.map((candidate, at) => (at === 0 ? { ...candidate, published: '2026-11-16T10:00:00.000Z' } : candidate)) };
    expect(issueProblems(ISSUE_TWO, context(stale)).some((problem) => problem.includes('outside the 7 days'))).toBe(true);
    expect(issueProblems(ISSUE_TWO, context(future)).some((problem) => problem.includes('outside the 7 days'))).toBe(true);
  });

  it('fails a new issue that carries a lead, a section heading or a field of its own', () => {
    expect(shapeProblems(ISSUE_TWO)).toEqual([]);
    expect(shapeProblems({ ...ISSUE_TWO, leadText: 'A word from us.', leadClips: [] })).toEqual(['the issue must have exactly the fields slug, number, date, title, pageTitle, summary, sections']);
    const headed = { ...ISSUE_TWO, sections: ISSUE_TWO.sections.map((section) => ({ ...section, heading: 'Golf' })) };
    expect(shapeProblems(headed)).toEqual(['each section must have exactly the fields key, items']);
    const promo = { ...ISSUE_TWO, sections: ISSUE_TWO.sections.map((section) => ({ ...section, items: section.items.map((item) => ({ ...item, storeUrl: 'https://apps.apple.com/app/id1' })) })) };
    expect(shapeProblems(promo)).toEqual(['each item must have exactly the fields headline, body, sourceLabel, sourceUrl']);
    expect(issueFileProblems({ ...ISSUE_TWO, leadText: 'x' }, ISSUE_TWO, context()).length).toBe(1);
  });

  it('rejects copy that breaks the site\'s copy rules', () => {
    expect(issueProblems({ ...ISSUE_TWO, summary: 'A shot tracer on TV.' }, context())).toContain('the copy puts "shot" before "tracer"');
    expect(issueProblems({ ...ISSUE_TWO, summary: 'Golf meets baseball.' }, context())).toContain('the copy names baseball');
    expect(issueProblems({ ...ISSUE_TWO, summary: 'A laser measures the carry distance.' }, context())).toContain('the copy claims something measures distance');
  });

  it('counts initials and month abbreviations as part of a sentence', () => {
    expect(sentenceCount('J. Smith won on Oct. 3 by two shots. He led all week.')).toBe(2);
  });
});
