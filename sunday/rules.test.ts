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

const golfStory = ISSUE_TWO.sections[0]?.items[0];
if (golfStory === undefined) throw new Error('fixture golf story missing');

function withGolf(changes: Partial<SundaySection>): SundayIssue {
  const [golf, tracer] = ISSUE_TWO.sections;
  if (golf === undefined || tracer === undefined) throw new Error('fixture sections missing');
  return { ...ISSUE_TWO, sections: [{ ...golf, ...changes }, tracer] };
}

const storyProblems = (changes: Partial<typeof golfStory>): readonly string[] => issueProblems(withGolf({ items: [{ ...golfStory, ...changes }] }), context());

describe('issueProblems', () => {
  it('accepts an issue that follows the rules', () => {
    expect(issueProblems(ISSUE_TWO, context())).toEqual([]);
  });

  it('accepts a thin week whose only story is the lead', () => {
    const thin = { ...ISSUE_TWO, sections: [] };
    expect(issueProblems(thin, context())).toEqual([]);
  });

  it('rejects disc golf in the Golf section or the summary', () => {
    const golfItem = { ...golfStory, body: `${golfStory.body} A disc golf story.` };
    expect(issueProblems(withGolf({ items: [golfItem] }), context())).toContain('disc golf is named in the Golf section');
    expect(issueProblems({ ...ISSUE_TWO, summary: 'Disc golf this week.' }, context())).toContain('disc golf is named outside the Disc golf section');
  });

  it('fails an issue that names an app, a store or a download', () => {
    const story = (extra: string): SundayIssue => withGolf({ items: [{ ...golfStory, body: `${golfStory.body} ${extra}` }] });
    expect(issueProblems(story('Smith won. Film your own swing with Tracer.'), context())).toContain('the copy names an app');
    expect(issueProblems(story('Smith won. Our Golf GPS app has the yardages.'), context())).toContain('the copy names an app');
    expect(issueProblems({ ...ISSUE_TWO, editorNote: `${ISSUE_TWO.editorNote ?? ''} Get the app.` }, context())).toContain('the copy names an app');
    expect(storyProblems({ whyItMatters: 'Download it and try the drill yourself.' })).toContain('the copy asks for a download');
    const promotedPreview = { title: 'Get the ESPN app', siteName: 'ESPN', description: '', image: null };
    expect(storyProblems({ preview: promotedPreview })).toContain('"A final-round charge" has a preview code would not fill');
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

  it('holds each write-up to 60 to 150 words and one line on why it matters', () => {
    const short = storyProblems({ body: 'Smith won by two.' }).join('\n');
    expect(short).toContain('"A final-round charge" has 4 words; 60 to 150 allowed');
    const long = storyProblems({ body: `${golfStory.body} ${golfStory.body} ${golfStory.body}` }).join('\n');
    expect(long).toContain('words; 60 to 150 allowed');
    const twoLines = storyProblems({ whyItMatters: 'Play your own game. Ignore the board.' }).join('\n');
    expect(twoLines).toContain('says why it matters in 2 sentences; one allowed');
    expect(storyProblems({ whyItMatters: null })).toContain('"A final-round charge" has no line on why it matters');
  });

  it('holds the editor\'s note to 60 to 120 words of our own', () => {
    expect(issueProblems({ ...ISSUE_TWO, editorNote: null }, context())).toContain("the issue has no editor's note");
    expect(issueProblems({ ...ISSUE_TWO, editorNote: 'A short week.' }, context())).toContain("the editor's note has 3 words; 60 to 120 allowed");
  });

  it('rejects a write-up that copies eight words in a row from its source', () => {
    const candidates = candidatesFor(ISSUE_TWO);
    const copiedFrom = { ...candidates, candidates: candidates.candidates.map((candidate) => (candidate.link === golfStory.sourceUrl ? { ...candidate, excerpt: 'He made seven birdies and no bogeys on the way to a 63.' } : candidate)) };
    expect(issueProblems(ISSUE_TWO, context(copiedFrom)).join()).toContain('copies its source word for word: "he made seven birdies and no bogeys on"');
    const fromPreview = { title: 'Smith wins', siteName: 'BBC Sport', description: 'It was the first title of his career after four years of near misses.', image: null };
    expect(storyProblems({ preview: fromPreview }).join()).toContain('copies its source word for word');
  });

  it('dates each story from its source and wants an https preview image', () => {
    expect(storyProblems({ published: '2026-11-10' })).toContain('"A final-round charge" must carry its source\'s date, 2026-11-13');
    const preview = { title: 'Smith wins', siteName: 'BBC Sport', description: '', image: 'http://example.com/a.jpg' };
    expect(storyProblems({ preview })).toContain('"A final-round charge" has a preview code would not fill');
    expect(storyProblems({ preview: { ...preview, image: 'https://me:pw@example.com/a.jpg' } })).toHaveLength(1);
  });

  it('rejects more than five stories counting the lead, and a repeated source', () => {
    const six = withGolf({ items: Array.from({ length: 4 }, () => golfStory) });
    const problems = issueProblems(six, context()).join('\n');
    expect(problems).toContain('6 stories with the lead; 1 to 5 allowed');
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

const lead = ISSUE_TWO.lead;
const tip = ISSUE_TWO.sundayRound;
const event = ISSUE_TWO.thisWeek?.[0];
if (lead === null || tip === null || event === undefined) throw new Error('fixture blocks missing');
const problemsOf = (changes: Partial<SundayIssue>): string => issueProblems({ ...ISSUE_TWO, ...changes }, context()).join('\n');

describe('the lead story', () => {
  it('is required, from a golf source, 150 to 250 words, with its source\'s picture', () => {
    expect(problemsOf({ lead: null })).toContain('the issue has no lead story');
    expect(problemsOf({ lead: { ...lead, body: golfStory.body } })).toContain('the lead story "Jones waits out the wind" has 74 words; 150 to 250 allowed');
    expect(problemsOf({ lead: { ...lead, preview: null } })).toContain('the lead story "Jones waits out the wind" has no picture from its source');
    expect(problemsOf({ lead: { ...lead, preview: { title: 'Jones wins', siteName: 'Sky Sports', description: '', image: null } } })).toContain('has no picture from its source');
  });

  it('keeps disc golf out of the lead and refuses a disc golf source', () => {
    expect(problemsOf({ lead: { ...lead, body: `${lead.body} Disc golf too.` } })).toContain('disc golf is named outside the Disc golf section');
    const disc = ISSUE_TWO.sections[1]?.items[0];
    if (disc === undefined) throw new Error('fixture disc story missing');
    expect(problemsOf({ lead: { ...lead, sourceUrl: disc.sourceUrl, sourceLabel: disc.sourceLabel } })).toContain('which belongs in the tracer section');
  });
});

describe('quick hits', () => {
  it('holds 3 to 5 one-line items, each linking a collected story of its own', () => {
    expect(problemsOf({ quickHits: ISSUE_TWO.quickHits.slice(0, 2) })).toContain('2 quick hits; 3 to 5 allowed');
    const [first, ...rest] = ISSUE_TWO.quickHits;
    if (first === undefined) throw new Error('fixture quick hit missing');
    expect(problemsOf({ quickHits: [{ ...first, text: 'Short.' }, ...rest] })).toContain('quick hit 1 has 1 words; 6 to 30 allowed');
    expect(problemsOf({ quickHits: [{ ...first, text: `${first.text} And a second sentence follows here.` }, ...rest] })).toContain('quick hit 1 takes 2 sentences; one allowed');
    expect(problemsOf({ quickHits: [{ ...first, sourceUrl: 'https://example.com/elsewhere' }, ...rest] })).toContain("quick hit 1 links https://example.com/elsewhere, which is not one of this week's collected stories");
    expect(problemsOf({ quickHits: [{ ...first, sourceUrl: golfStory.sourceUrl, sourceLabel: golfStory.sourceLabel }, ...rest] })).toContain('quick hit 1 repeats a source');
  });
});

describe('This week', () => {
  it('is required, and an empty box is a week with no tour event', () => {
    expect(problemsOf({ thisWeek: null })).toContain('the issue has no This week box');
    expect(problemsOf({ thisWeek: [] })).toBe('');
  });

  it('lists events of the coming week with a venue, sourced to a collected story or a tour schedule', () => {
    expect(problemsOf({ thisWeek: [{ ...event, starts: '2026-11-15', ends: '2026-11-15' }] })).toContain('starts 2026-11-15, outside the coming week (2026-11-16 to 2026-11-22)');
    expect(problemsOf({ thisWeek: [{ ...event, ends: '2026-11-18' }] })).toContain('needs yyyy-mm-dd starts and ends');
    expect(problemsOf({ thisWeek: [{ ...event, venue: ' ' }] })).toContain('has no venue');
    expect(problemsOf({ thisWeek: [{ ...event, sourceLabel: 'Golf Monthly' }] })).toContain('must credit "PGA Tour"');
    expect(problemsOf({ thisWeek: [{ ...event, sourceUrl: 'https://example.com/schedule' }] })).toContain('neither a collected story nor a tour\'s schedule');
    const fromStory = { ...event, sourceUrl: golfStory.sourceUrl, sourceLabel: golfStory.sourceLabel };
    expect(problemsOf({ sections: [], thisWeek: [fromStory] })).toBe('');
    expect(problemsOf({ thisWeek: [fromStory] })).toContain('the event "The Island Championship" repeats a source');
    expect(problemsOf({ thisWeek: [event, { ...event, name: 'A second week on the same schedule' }] })).not.toContain('repeats a source');
    expect(problemsOf({ thisWeek: [{ ...event, sourceUrl: lead.sourceUrl, sourceLabel: lead.sourceLabel }] })).toContain('repeats a source');
    expect(problemsOf({ thisWeek: Array.from({ length: 5 }, () => event) })).toContain('5 events this week; at most 4 allowed');
  });
});

describe('For your Sunday round', () => {
  it('is required, 40 to 120 words, from a collected golf story', () => {
    expect(problemsOf({ sundayRound: null })).toContain('the issue has no For your Sunday round tip');
    expect(problemsOf({ sundayRound: { ...tip, body: 'Drop it near where it was lost.' } })).toContain('has 7 words; 40 to 120 allowed');
    expect(problemsOf({ sundayRound: { ...tip, sourceUrl: lead.sourceUrl, sourceLabel: lead.sourceLabel } })).toContain('repeats a source');
  });
});

describe('every published issue', () => {
  it('follows the rules against the issues before it, or for an earlier layout at least promotes nothing', () => {
    SUNDAY_ISSUES.forEach((issue, at) => {
      const problems = issueProblems(issue, { earlierIssues: SUNDAY_ISSUES.slice(0, at), candidates: candidatesFor(issue) });
      const earlierLayout = issue.editorNote === null;
      expect(earlierLayout ? problems.filter((problem) => problem.startsWith('the copy')) : problems, issue.slug).toEqual([]);
    });
  });

  it('reads the issues written before the editor\'s note as plain stories without previews', () => {
    const earlier = SUNDAY_ISSUES.filter((issue) => issue.editorNote === null);
    expect(earlier.map((issue) => issue.slug)).toEqual(['2026-11-01', '2026-11-22']);
    expect(earlier.flatMap((issue) => issue.sections.flatMap((section) => section.items)).every((item) => item.preview === null && item.whyItMatters === null)).toBe(true);
  });

  it('rejects a story published outside the seven days before the issue', () => {
    const base = candidatesFor(ISSUE_TWO);
    const stale = { ...base, candidates: base.candidates.map((candidate) => (candidate.link === golfStory.sourceUrl ? { ...candidate, published: '2026-11-07T10:00:00.000Z' } : candidate)) };
    const future = { ...base, candidates: base.candidates.map((candidate) => (candidate.link === golfStory.sourceUrl ? { ...candidate, published: '2026-11-16T10:00:00.000Z' } : candidate)) };
    expect(issueProblems(ISSUE_TWO, context(stale)).some((problem) => problem.includes('outside the 7 days'))).toBe(true);
    expect(issueProblems(ISSUE_TWO, context(future)).some((problem) => problem.includes('outside the 7 days'))).toBe(true);
  });

  it('fails a new issue that carries a lead, a section heading or a field of its own', () => {
    expect(shapeProblems(ISSUE_TWO)).toEqual([]);
    expect(shapeProblems({ ...ISSUE_TWO, leadText: 'A word from us.', leadClips: [] })).toEqual(['the issue must have exactly the fields slug, number, date, title, pageTitle, summary, editorNote, lead, quickHits, thisWeek, sundayRound, sections']);
    expect(shapeProblems({ ...ISSUE_TWO, quickHits: [{ ...ISSUE_TWO.quickHits[0], image: 'x' }] })).toEqual(['each quick hit must have exactly the fields text, sourceLabel, sourceUrl']);
    expect(shapeProblems({ ...ISSUE_TWO, sundayRound: { ...ISSUE_TWO.sundayRound, storeUrl: 'x' } })).toEqual(['the Sunday round tip must have exactly the fields kind, headline, body, sourceLabel, sourceUrl']);
    expect(shapeProblems({ ...ISSUE_TWO, thisWeek: [{ ...ISSUE_TWO.thisWeek?.[0], tickets: 'x' }] })).toEqual(['each event must have exactly the fields name, starts, ends, venue, whyWatch, sourceLabel, sourceUrl']);
    const headed = { ...ISSUE_TWO, sections: ISSUE_TWO.sections.map((section) => ({ ...section, heading: 'Golf' })) };
    expect(shapeProblems(headed)).toEqual(['each section must have exactly the fields key, items']);
    const promo = { ...ISSUE_TWO, sections: ISSUE_TWO.sections.map((section) => ({ ...section, items: section.items.map((item) => ({ ...item, storeUrl: 'https://apps.apple.com/app/id1' })) })) };
    expect(shapeProblems(promo)).toEqual(['each item must have exactly the fields headline, body, whyItMatters, sourceLabel, sourceUrl, published, preview']);
    const photo = { ...ISSUE_TWO, sections: ISSUE_TWO.sections.map((section) => ({ ...section, items: section.items.map((item) => ({ ...item, preview: { title: 't', siteName: 's', description: 'd', image: null, photo: 'x' } })) })) };
    expect(shapeProblems(photo)).toEqual(['each preview must have exactly the fields title, siteName, description, image']);
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
