import type { Clip } from './tutorial.ts';

export type SundaySectionKey = 'golf' | 'discGolf';

export type LegacySectionKey = 'golf' | 'tracer';

export interface SectionFacts {
  heading: string;
  anchor: string;
}

export interface SourcePreview {
  title: string;
  siteName: string;
  description: string;
  image: string | null;
}

export interface SundayStory {
  headline: string;
  body: string;
  whyItMatters: string;
  published: string;
  sourceLabel: string;
  sourceUrl: string;
  preview: SourcePreview | null;
}

export interface SundaySection {
  key: SundaySectionKey;
  items: readonly SundayStory[];
}

export interface SundayIssueHeader {
  slug: string;
  number: number;
  date: string;
  title: string;
  pageTitle: string;
  summary: string;
}

export interface CurrentIssue extends SundayIssueHeader {
  format: 2;
  editorsNote: string;
  sections: readonly SundaySection[];
}

export interface LegacyItem {
  headline: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface LegacySection {
  key: LegacySectionKey;
  heading: string;
  items: readonly LegacyItem[];
}

export interface LegacyIssue extends SundayIssueHeader {
  format: 1;
  leadText: string;
  leadClips: readonly Clip[];
  sections: readonly LegacySection[];
}

export type SundayIssue = CurrentIssue | LegacyIssue;

export interface PublishedDate {
  iso: string;
  label: string;
}

export interface StoryView {
  anchor: string;
  headline: string;
  body: string;
  whyItMatters: string | null;
  published: PublishedDate | null;
  sourceLabel: string;
  sourceUrl: string;
  preview: SourcePreview | null;
}

export interface SectionView {
  key: SundaySectionKey;
  heading: string;
  anchor: string;
  stories: readonly StoryView[];
}

export interface IssueView {
  editorsNote: string | null;
  sections: readonly SectionView[];
}
