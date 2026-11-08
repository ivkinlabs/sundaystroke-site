import type { Candidate, CandidateFile } from './types.ts';
import type { SundayIssue } from '../types/sunday.ts';

export function candidatesFor(issue: SundayIssue): CandidateFile {
  const candidates: Candidate[] = issue.sections.flatMap((section) =>
    section.items.map((item) => ({
      title: item.headline,
      link: item.sourceUrl,
      published: `${issue.slug}T08:00:00.000Z`,
      excerpt: item.body,
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
  leadText: 'Here is a swing traced in the Tracer app.',
  leadClips: [{ src: '/media/learn/golf-result.mp4', poster: '/media/learn/golf-result.jpg', label: 'Traced' }],
  sections: [
    {
      key: 'golf',
      heading: 'Golf',
      items: [
        { headline: 'A final-round charge', body: 'Smith shot 63 to win by two. It was his first title.', sourceLabel: 'BBC Sport', sourceUrl: 'https://www.bbc.co.uk/sport/golf/1' },
      ],
    },
    {
      key: 'tracer',
      heading: 'For Tracer: disc golf',
      items: [
        { headline: 'Worlds move', body: 'The PDGA set new dates for Pro Worlds.', sourceLabel: 'PDGA', sourceUrl: 'https://www.pdga.com/news/1' },
      ],
    },
  ],
};
