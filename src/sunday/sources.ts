import type { FeedSource } from './types.ts';

export const SUNDAY_SOURCES: readonly FeedSource[] = [
  { name: 'GOLF.com', feedUrl: 'https://golf.com/feed/', section: 'golf' },
  { name: 'Golf Monthly', feedUrl: 'https://www.golfmonthly.com/feeds.xml', section: 'golf' },
  { name: 'National Club Golfer', feedUrl: 'https://www.nationalclubgolfer.com/feed/', section: 'golf' },
  { name: 'BBC Sport', feedUrl: 'https://feeds.bbci.co.uk/sport/golf/rss.xml', section: 'golf' },
  { name: 'Sky Sports', feedUrl: 'https://www.skysports.com/rss/12176', section: 'golf' },
  { name: 'ESPN', feedUrl: 'https://www.espn.com/espn/rss/golf/news', section: 'golf' },
  { name: 'PDGA', feedUrl: 'https://www.pdga.com/frontpage/feed', section: 'tracer' },
  { name: 'DGPT', feedUrl: 'https://www.dgpt.com/feed/', section: 'tracer' },
];

export const PILOT_ISSUES: number = 4;
export const MAX_ITEMS: number = 5;
export const ITEM_WINDOW_DAYS: number = 7;
export const EXCERPT_CHARS: number = 280;
export const PUBLISH_HOUR: number = 8;
export const SITE_ORIGIN: string = 'https://sundaystroke.com';
export const SITE_REPO: string = 'ivkinlabs/sundaystroke-site';
export const FACTORY_APP: string = 'golfgps';
export const FACTORY_RUNTIME: string = '/Users/ivkin/my/factory-runtime';
export const FIRST_AUTOMATED_ISSUE: string = '2026-11-15';
export const CHECKER_MODEL: string = 'claude-opus-5-5';
export const SECTION_HEADINGS: Readonly<Record<'golf' | 'tracer', string>> = {
  golf: 'Golf',
  tracer: 'For Tracer: disc golf',
};
export const DISC_GOLF_WORDS: RegExp = /disc\s*golf|\bPDGA\b|\bDGPT\b/i;
