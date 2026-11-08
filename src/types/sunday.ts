import type { Clip } from './tutorial.ts';

export type SundaySectionKey = 'golf' | 'tracer';

export interface SundayItem {
  headline: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface SundaySection {
  key: SundaySectionKey;
  heading: string;
  items: readonly SundayItem[];
}

export interface SundayIssue {
  slug: string;
  number: number;
  date: string;
  title: string;
  pageTitle: string;
  summary: string;
  leadText: string;
  leadClips: readonly Clip[];
  sections: readonly SundaySection[];
}
