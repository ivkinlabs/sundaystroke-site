import type { Candidate, CandidateFile } from './types.ts';
import type { CurrentIssue } from '../src/types/sunday.ts';

export function candidatesFor(issue: CurrentIssue): CandidateFile {
  const candidates: Candidate[] = issue.sections.flatMap((section) =>
    section.items.map((item, at) => ({
      title: `Collected story ${at + 1} from ${item.sourceLabel}`,
      link: item.sourceUrl,
      published: `${issue.slug}T08:00:00.000Z`,
      excerpt: `The feed's own short summary of story ${at + 1}.`,
      sourceName: item.sourceLabel,
      section: section.key,
    })),
  );
  return { issueDate: issue.slug, collectedAt: `${issue.slug}T07:00:00.000Z`, since: `${issue.slug}T00:00:00.000Z`, candidates, failures: [] };
}

export const ISSUE_TWO: CurrentIssue = {
  format: 2,
  slug: '2026-11-15',
  number: 2,
  date: 'Sunday 15 November 2026',
  title: 'The Sunday post, issue 2',
  pageTitle: 'A Final-Round Charge | SundayStroke',
  summary: 'A final-round charge and new dates for the disc golf worlds.',
  editorsNote:
    'This was a week for patience. Smith spent four rounds waiting for his putter to warm up and then holed everything on Sunday, which is the best argument we know for sticking with a routine when nothing drops. Away from the fairways, the disc golf world finally knows when its biggest week will be played, so anyone planning a summer trip can start booking. Two short reads, both worth your coffee.',
  sections: [
    {
      key: 'golf',
      items: [
        {
          headline: 'A final-round charge',
          body: 'Smith started the last day four behind and finished two ahead after a 63, the lowest closing round of the season on that course. He made seven birdies in his final eleven holes and did not drop a shot all day. It was his first title after several near misses this year, and he said afterwards that he had stopped changing his putting stroke between rounds and simply trusted it.',
          whyItMatters: 'Sticking with one putting routine for a whole round beats tinkering after every miss.',
          published: '2026-11-15',
          sourceLabel: 'BBC Sport',
          sourceUrl: 'https://www.bbc.co.uk/sport/golf/1',
          preview: { title: 'Smith charges to first title', siteName: 'BBC Sport', description: 'A closing round to remember.', image: 'https://ichef.bbci.co.uk/news/1024/a.jpg' },
        },
      ],
    },
    {
      key: 'discGolf',
      items: [
        {
          headline: 'Worlds move',
          body: 'The PDGA has set new dates for its Pro Worlds after the original week clashed with another major event on the calendar. The championship keeps its host city and its courses, and players who already registered keep their places without paying again. Organisers said the change gives volunteers more time to prepare the courses and lets more spectators attend on the final weekend, which usually draws the biggest crowds.',
          whyItMatters: 'If you planned a trip to watch, check the new week before you book anything.',
          published: '2026-11-15',
          sourceLabel: 'PDGA',
          sourceUrl: 'https://www.pdga.com/news/1',
          preview: { title: 'Pro Worlds dates announced', siteName: 'PDGA', description: '', image: null },
        },
      ],
    },
  ],
};
