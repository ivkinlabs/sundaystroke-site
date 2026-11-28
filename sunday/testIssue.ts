import { addDays } from './calendar.ts';
import { tourScheduleFor } from './sources.ts';
import type { Candidate, CandidateFile } from './types.ts';
import type { SundayEvent, SundayIssue, SundayItem, SundayQuickHit, SundaySectionKey, SundayTip } from '../src/types/sunday.ts';

const EXCERPT: string = 'The feed excerpt for this story.';
const TITLE: string = 'A story collected this week';

function candidate(title: string, link: string, sourceName: string, day: string, section: SundaySectionKey): Candidate {
  return { title, link, published: `${day}T08:00:00.000Z`, excerpt: EXCERPT, sourceName, section };
}

export function candidatesFor(issue: SundayIssue): CandidateFile {
  const story = (item: SundayItem, section: SundaySectionKey): Candidate => candidate(TITLE, item.sourceUrl, item.sourceLabel, item.published ?? issue.slug, section);
  const linked = (link: SundayQuickHit | SundayTip | SundayEvent): Candidate => candidate(TITLE, link.sourceUrl, link.sourceLabel, addDays(issue.slug, -1), 'golf');
  const reported = (issue.thisWeek ?? []).filter((event) => tourScheduleFor(event.sourceUrl) === null);
  const candidates: Candidate[] = [
    ...(issue.lead === null ? [] : [story(issue.lead, 'golf')]),
    ...issue.sections.flatMap((section) => section.items.map((item) => story(item, section.key))),
    ...issue.quickHits.map(linked),
    ...(issue.sundayRound === null ? [] : [linked(issue.sundayRound)]),
    ...reported.map(linked),
  ];
  return { issueDate: issue.slug, collectedAt: `${issue.slug}T07:00:00.000Z`, since: `${issue.slug}T00:00:00.000Z`, candidates, failures: [] };
}

export const ISSUE_TWO: SundayIssue = {
  slug: '2026-11-15',
  number: 2,
  date: 'Sunday 15 November 2026',
  title: 'The Sunday post, issue 2',
  pageTitle: 'A Final-Round Charge | SundayStroke',
  summary: 'A final-round charge and a putting habit.',
  editorNote:
    'This was a week for patience. Smith spent three days a few shots back and then went low when it counted, closing with a 63 that nobody near the top could answer. It was his first title, and it came from waiting for the right holes rather than forcing birdies early. The calendar also moved for next year, which matters to anyone planning a trip.',
  lead: {
    headline: 'Jones waits out the wind',
    body: 'Jones won the season finale on Sunday by holding his nerve on a day when the wind pushed every score up. He began the final round one shot behind and never led until the 16th hole, where a long par save kept him level while the players around him dropped shots. He then made birdie at the 17th from close range and played the last hole safely to the middle of the green for a one-shot win.\n\nThe win lifts him into the top ten of the season standings and secures his card for next year. Afterwards he said he had picked a target on the left of every green in the crosswind and never aimed at a flag on the back nine. Only four players broke par on the day, and the average score was almost three over. For most of the field the round was about avoiding the big number rather than chasing birdies, and Jones was the one who did that best.',
    whyItMatters: 'On a windy day the middle of the green is a good result, and patience beats aggression.',
    sourceLabel: 'Sky Sports',
    sourceUrl: 'https://www.skysports.com/golf/news/1',
    published: '2026-11-15',
    preview: { title: 'Jones holds on in the wind', siteName: 'Sky Sports', description: 'A one-shot win in testing weather.', image: 'https://e0.365dm.com/1.jpg' },
  },
  quickHits: [
    { text: 'The ladies tour named its new chief executive, who starts in January.', sourceLabel: 'Golf Monthly', sourceUrl: 'https://www.golfmonthly.com/news/1' },
    { text: 'A course in Scotland reopened its links after a winter of storm repairs.', sourceLabel: 'National Club Golfer', sourceUrl: 'https://www.nationalclubgolfer.com/news/1' },
    { text: 'The amateur champion turned professional and plays his first event next month.', sourceLabel: 'ESPN', sourceUrl: 'https://www.espn.com/golf/story/1' },
  ],
  thisWeek: [
    {
      name: 'The Island Championship',
      starts: '2026-11-19',
      ends: '2026-11-22',
      venue: 'Port Royal, Bermuda',
      whyWatch: 'The last full-field event of the year decides who keeps a card for next season.',
      sourceLabel: 'PGA Tour',
      sourceUrl: 'https://www.pgatour.com/tournaments/2026/island-championship',
    },
  ],
  sundayRound: {
    kind: 'rule',
    headline: 'Lost ball? Take the new local option',
    body: 'If your ball is lost or out of bounds and you did not hit a provisional, many clubs now let you drop near where it was lost for two penalty strokes instead of walking back to the tee. Ask the starter whether your club uses this local rule before you tee off, because it only applies when the committee has adopted it.',
    sourceLabel: 'GOLF.com',
    sourceUrl: 'https://golf.com/instruction/rules/1',
  },
  sections: [
    {
      key: 'golf',
      items: [
        {
          headline: 'A final-round charge',
          body: 'Smith started the last round three behind and finished it two ahead. He made seven birdies and no bogeys on the way to a 63, the lowest score of the week by two, and he did most of the damage on the par fives. It was the first title of his career after four years of near misses, and he said afterwards that he had stopped looking at the leaderboard on the back nine.',
          whyItMatters: 'Playing your own round and ignoring the scores around you is a habit any club golfer can copy.',
          sourceLabel: 'BBC Sport',
          sourceUrl: 'https://www.bbc.co.uk/sport/golf/1',
          published: '2026-11-13',
          preview: { title: 'Smith charges to first title', siteName: 'BBC Sport', description: 'A closing 63 settles it.', image: 'https://ichef.bbci.co.uk/news/1.jpg' },
        },
      ],
    },
    {
      key: 'tracer',
      items: [
        {
          headline: 'Worlds move',
          body: 'The PDGA set new dates for Pro Worlds next year, moving the event so it no longer clashes with two other big tournaments in the same month. Players who had already booked travel can change their plans without a fee, the organisers said. The venue stays the same, and registration opens on the date that was announced earlier in the season, so nothing else about entering changes.',
          whyItMatters: 'If you were planning to watch in person, check the new dates before you book anything.',
          sourceLabel: 'PDGA',
          sourceUrl: 'https://www.pdga.com/news/1',
          published: '2026-11-12',
          preview: null,
        },
      ],
    },
  ],
};
