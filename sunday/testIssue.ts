import type { Candidate, CandidateFile } from './types.ts';
import type { SundayIssue } from '../src/types/sunday.ts';

export function candidatesFor(issue: SundayIssue): CandidateFile {
  const candidates: Candidate[] = issue.sections.flatMap((section) =>
    section.items.map((item) => ({
      title: item.headline,
      link: item.sourceUrl,
      published: `${item.published ?? issue.slug}T08:00:00.000Z`,
      excerpt: 'The feed excerpt for this story.',
      sourceName: item.sourceLabel,
      section: section.key,
    })),
  );
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
