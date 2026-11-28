export type SundaySectionKey = 'golf' | 'tracer';

export interface SundayPreview {
  title: string;
  siteName: string;
  description: string;
  image: string | null;
}

export interface SourceCredit {
  sourceLabel: string;
  sourceUrl: string;
}

export interface SundayItem extends SourceCredit {
  headline: string;
  body: string;
  whyItMatters: string | null;
  published: string | null;
  preview: SundayPreview | null;
}

export interface SundaySection {
  key: SundaySectionKey;
  items: readonly SundayItem[];
}

export interface SundayQuickHit extends SourceCredit {
  text: string;
}

export interface SundayEvent extends SourceCredit {
  name: string;
  starts: string;
  ends: string;
  venue: string;
  whyWatch: string;
}

export type SundayTipKind = 'rule' | 'drill' | 'course management';

export interface SundayTip extends SourceCredit {
  kind: SundayTipKind;
  headline: string;
  body: string;
}

export interface SundayIssue {
  slug: string;
  number: number;
  date: string;
  title: string;
  pageTitle: string;
  summary: string;
  editorNote: string | null;
  lead: SundayItem | null;
  quickHits: readonly SundayQuickHit[];
  thisWeek: readonly SundayEvent[] | null;
  sundayRound: SundayTip | null;
  sections: readonly SundaySection[];
}
