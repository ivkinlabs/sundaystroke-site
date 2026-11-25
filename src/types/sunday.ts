export type SundaySectionKey = 'golf' | 'tracer';

export interface SundayItem {
  headline: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface SundaySection {
  key: SundaySectionKey;
  items: readonly SundayItem[];
}

export interface SundayIssue {
  slug: string;
  number: number;
  date: string;
  title: string;
  pageTitle: string;
  summary: string;
  sections: readonly SundaySection[];
}
