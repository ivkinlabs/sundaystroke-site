export type SundaySectionKey = 'golf' | 'tracer';

export interface SundayItem {
  headline: string;
  body: string;
  whyItMatters: string | null;
  sourceLabel: string;
  sourceUrl: string;
  published: string | null;
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
  editorNote: string | null;
  sections: readonly SundaySection[];
}
