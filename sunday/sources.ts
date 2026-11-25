import { PROMOTION } from '../src/lib/promotion.ts';
import type { FeedSource, WordRange } from './types.ts';

export const SUNDAY_SOURCES: readonly FeedSource[] = [
  { name: 'GOLF.com', feedUrl: 'https://golf.com/feed/', section: 'golf' },
  { name: 'Golf Monthly', feedUrl: 'https://www.golfmonthly.com/feeds.xml', section: 'golf' },
  { name: 'National Club Golfer', feedUrl: 'https://www.nationalclubgolfer.com/feed/', section: 'golf' },
  { name: 'BBC Sport', feedUrl: 'https://feeds.bbci.co.uk/sport/golf/rss.xml', section: 'golf' },
  { name: 'Sky Sports', feedUrl: 'https://www.skysports.com/rss/12176', section: 'golf' },
  { name: 'ESPN', feedUrl: 'https://www.espn.com/espn/rss/golf/news', section: 'golf' },
  { name: 'PDGA', feedUrl: 'https://www.pdga.com/frontpage/feed', section: 'discGolf' },
  { name: 'DGPT', feedUrl: 'https://www.dgpt.com/feed/', section: 'discGolf' },
];

export const PILOT_ISSUES: number = 4;
export const MAX_ITEMS: number = 5;
export const ITEM_WINDOW_DAYS: number = 7;
export const EXCERPT_CHARS: number = 280;
export const SITE_ORIGIN: string = 'https://sundaystroke.com';
export const SITE_REPO: string = 'ivkinlabs/sundaystroke-site';
export const FACTORY_RUNTIME: string = '/Users/ivkin/my/factory-runtime';
export const FIRST_AUTOMATED_ISSUE: string = '2026-11-15';
export const CHECKER_MODEL: string = 'claude-opus-5-5';
export const NOTE_WORDS: WordRange = { min: 60, max: 120 };
export const BODY_WORDS: WordRange = { min: 60, max: 150 };
export const WHY_MAX_WORDS: number = 40;
export const HEADLINE_MAX_WORDS: number = 14;
export const COPIED_RUN_WORDS: number = 8;
export const PREVIEW_DESCRIPTION_CHARS: number = 220;
export const DISC_GOLF_WORDS: RegExp = /disc\s*golf|\bPDGA\b|\bDGPT\b/i;

export interface CopyRule {
  pattern: RegExp;
  reason: string;
}

export const COPY_RULES: readonly CopyRule[] = [
  { pattern: PROMOTION, reason: 'names an app, a store or a download' },
  { pattern: /baseball/i, reason: 'names baseball' },
  { pattern: /shot\s*tracer/i, reason: 'puts "shot" before "tracer"' },
  { pattern: /\b(?:measures?|measuring|calculates?|calculating|tracks?|tracking)\b[^.]{0,40}\bdistance/i, reason: 'claims something measures distance' },
];
