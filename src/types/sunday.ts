export type SundaySectionKey = 'golf' | 'tracer';

export interface SundayPreview {
  title: string;
  siteName: string;
  description: string;
  image: string | null;
}

export interface SundayItem {
  headline: string;
  body: string;
  whyItMatters: string | null;
  sourceLabel: string;
  sourceUrl: string;
  published: string | null;
  preview: SundayPreview | null;
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
