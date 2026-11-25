import { describe, expect, it } from 'vitest';
import { issueProblems } from './rules.ts';
import { longestSharedRun, sentenceCount, sharesWord, wordCount } from './text.ts';
import { ISSUE_TWO, candidatesFor } from './testIssue.ts';
import type { RuleContext } from './rules.ts';
import type { CandidateFile } from './types.ts';
import type { CurrentIssue, SundayStory } from '../src/types/sunday.ts';
import { SUNDAY_ISSUES } from '../src/data/sunday.ts';

const issueOne = SUNDAY_ISSUES[0];
if (issueOne === undefined) throw new Error('issue 1 is missing');

function context(candidates: CandidateFile = candidatesFor(ISSUE_TWO)): RuleContext {
  return { earlierIssues: [issueOne], candidates };
}

function golfStory(): SundayStory {
  const story = ISSUE_TWO.sections[0]?.items[0];
  if (story === undefined) throw new Error('fixture golf story missing');
  return story;
}

function withGolf(changes: Partial<SundayStory>): CurrentIssue {
  const [golf, disc] = ISSUE_TWO.sections;
  if (golf === undefined || disc === undefined) throw new Error('fixture sections missing');
  return { ...ISSUE_TWO, sections: [{ ...golf, items: [{ ...golfStory(), ...changes }] }, disc] };
}

const problemsOf = (issue: CurrentIssue, at: RuleContext = context()): string => issueProblems(issue, at).join('\n');

describe('issueProblems', () => {
  it('accepts an issue that follows the rules', () => {
    expect(issueProblems(ISSUE_TWO, context())).toEqual([]);
  });

  it('accepts a thin week with a single story', () => {
    expect(issueProblems({ ...ISSUE_TWO, sections: ISSUE_TWO.sections.slice(0, 1) }, context())).toEqual([]);
  });

  it('fails an issue that names an app, a store or a download', () => {
    for (const promo of ['Film it with the Tracer app.', 'Get it on the App Store.', 'Download Golf GPS today.', 'Free on iPhone.']) {
      expect(problemsOf({ ...ISSUE_TWO, editorsNote: `${ISSUE_TWO.editorsNote} ${promo}` }), promo).toContain('names an app, a store or a download');
    }
    expect(problemsOf(withGolf({ whyItMatters: 'Our app helps you do the same.' }))).toContain('names an app, a store or a download ("app")');
  });

  it("needs an editor's note of 60 to 120 words", () => {
    expect(problemsOf({ ...ISSUE_TWO, editorsNote: 'Short week.' })).toContain("the editor's note has 2 words; 60 to 120 allowed");
    expect(problemsOf({ ...ISSUE_TWO, editorsNote: 'word '.repeat(121) })).toContain("the editor's note has 121 words");
  });

  it('needs 60 to 150 original words per story and one line on why it matters', () => {
    expect(problemsOf(withGolf({ body: 'Smith won.' }))).toContain('"A final-round charge" has 2 words; 60 to 150 allowed');
    expect(problemsOf(withGolf({ whyItMatters: 'It matters. A lot.' }))).toContain('needs one line, at most 40 words, on why it matters');
    expect(problemsOf(withGolf({ whyItMatters: '' }))).toContain('needs one line');
  });

  it('rejects a story that copies eight words in a row from its source', () => {
    const candidates = candidatesFor(ISSUE_TWO);
    const copied = {
      ...candidates,
      candidates: candidates.candidates.map((candidate, at) =>
        at === 0 ? { ...candidate, excerpt: 'He made seven birdies in his final eleven holes and did not drop a shot.' } : candidate,
      ),
    };
    expect(problemsOf(ISSUE_TWO, context(copied))).toContain('"A final-round charge" repeats 8 or more words in a row from its source');
    expect(problemsOf(ISSUE_TWO, context(copied))).not.toContain("the editor's note repeats");
  });

  it("rejects an editor's note that copies a source", () => {
    const note = `${ISSUE_TWO.editorsNote} A closing round to remember for everyone who was watching it live.`;
    const preview = { ...golfStory().preview, title: 'x', siteName: 'BBC Sport', image: null, description: 'A closing round to remember for everyone who was watching it live.' };
    expect(problemsOf({ ...withGolf({ preview }), editorsNote: note })).toContain("the editor's note repeats 8 or more words");
  });

  it('needs a source preview with an https image or none', () => {
    expect(problemsOf(withGolf({ preview: null }))).toContain('has no source preview; run the preview command');
    const insecure = { title: 'T', siteName: 'BBC Sport', description: '', image: 'http://example.com/a.jpg' };
    expect(problemsOf(withGolf({ preview: insecure }))).toContain('preview image must be an https address');
    expect(problemsOf(withGolf({ preview: { ...insecure, image: null } }))).not.toContain('preview');
  });

  it("dates each story on the day its source published it, in Madrid", () => {
    expect(problemsOf(withGolf({ published: '2026-11-14' }))).toContain('must be dated 2026-11-15');
  });

  it('rejects disc golf in the Golf section', () => {
    expect(problemsOf(withGolf({ whyItMatters: 'Disc golf players should note this too.' }))).toContain('disc golf is named in the Golf section');
  });

  it('rejects a story that is not among the stories collected this week', () => {
    const stale = { ...candidatesFor(ISSUE_TWO), candidates: candidatesFor(ISSUE_TWO).candidates.slice(1) };
    expect(problemsOf(ISSUE_TWO, context(stale))).toContain("not one of this week's collected stories");
  });

  it('rejects a golf source in the Disc golf section and a wrong credit', () => {
    const candidates = candidatesFor(ISSUE_TWO);
    const moved = { ...candidates, candidates: candidates.candidates.map((candidate) => ({ ...candidate, section: 'golf' as const, sourceName: 'GOLF.com' })) };
    const problems = problemsOf(ISSUE_TWO, context(moved));
    expect(problems).toContain('belongs in the golf section');
    expect(problems).toContain('must credit "GOLF.com"');
  });

  it('rejects more than five items and a repeated source', () => {
    const [golf, disc] = ISSUE_TWO.sections;
    if (golf === undefined || disc === undefined) throw new Error('fixture sections missing');
    const six = { ...ISSUE_TWO, sections: [{ ...golf, items: Array.from({ length: 5 }, () => golfStory()) }, disc] };
    const problems = problemsOf(six);
    expect(problems).toContain('6 items');
    expect(problems).toContain('repeats a source');
  });

  it('rejects a wrong number, date or title and an existing date', () => {
    const problems = problemsOf({ ...ISSUE_TWO, number: 3, date: 'Sunday 15 Nov 2026', title: 'Issue 3' });
    expect(problems).toContain('number must be 2');
    expect(problems).toContain('date must read "Sunday 15 November 2026"');
    expect(problems).toContain('title must be "The Sunday post, issue 2"');
    expect(problemsOf({ ...ISSUE_TWO, slug: issueOne.slug }, { ...context(), candidates: { ...candidatesFor(ISSUE_TWO), issueDate: issueOne.slug } })).toContain('already exists');
  });

  it('rejects a story published outside the seven days before the issue', () => {
    const base = candidatesFor(ISSUE_TWO);
    const stale = { ...base, candidates: base.candidates.map((candidate, at) => (at === 0 ? { ...candidate, published: '2026-11-07T10:00:00.000Z' } : candidate)) };
    const future = { ...base, candidates: base.candidates.map((candidate, at) => (at === 0 ? { ...candidate, published: '2026-11-16T10:00:00.000Z' } : candidate)) };
    expect(problemsOf(ISSUE_TWO, context(stale))).toContain('outside the 7 days');
    expect(problemsOf(ISSUE_TWO, context(future))).toContain('outside the 7 days');
  });

  it("rejects copy that breaks the site's copy rules", () => {
    expect(problemsOf(withGolf({ whyItMatters: 'A shot tracer on TV showed it.' }))).toContain('the copy puts "shot" before "tracer"');
    expect(problemsOf({ ...ISSUE_TWO, summary: 'Golf meets baseball.' })).toContain('the copy names baseball');
  });
});

describe('text measures', () => {
  it('counts sentences without splitting on common abbreviations', () => {
    expect(sentenceCount('Dr. Smith won in the U.S. on Sunday.')).toBe(1);
    expect(sentenceCount('He won. She was second!')).toBe(2);
    expect(sentenceCount('J. Smith won on Oct. 3 by two shots. He led all week.')).toBe(2);
  });

  it('counts words, ignoring stray punctuation', () => {
    expect(wordCount('  Smith won – by two, at 16-under.  ')).toBe(6);
  });

  it('finds the longest run of words two texts share, ignoring case and punctuation', () => {
    expect(longestSharedRun('He won the title, at last!', 'At last he won the title')).toBe(4);
    expect(longestSharedRun('Nothing alike here', 'Totally different words')).toBe(0);
    expect(longestSharedRun('the école won', 'at the ecole won')).toBe(3);
    expect(longestSharedRun('he earned $1.2m there', 'earned $1.2m there')).toBe(3);
  });

  it('tells whether two titles share a meaningful word', () => {
    expect(sharesWord('Scheffler wins at Sun City', 'Scheffler takes the Nedbank title')).toBe(true);
    expect(sharesWord('Just a moment...', 'Scheffler takes the Nedbank title')).toBe(false);
  });
});

describe('every published issue in the current format', () => {
  it('follows the rules against the issues before it', () => {
    SUNDAY_ISSUES.forEach((issue, at) => {
      if (issue.format !== 2) return;
      const problems = issueProblems(issue, { earlierIssues: SUNDAY_ISSUES.slice(0, at), candidates: candidatesFor(issue) });
      expect(problems, issue.slug).toEqual([]);
    });
  });
});
