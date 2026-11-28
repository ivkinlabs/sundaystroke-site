import { hasStrings, isRecord } from './guards.ts';
import type {
  SundayEvent,
  SundayIssue,
  SundayItem,
  SundayPreview,
  SundayQuickHit,
  SundaySection,
  SundaySectionKey,
  SundayTip,
  SundayTipKind,
} from '../types/sunday.ts';

export const SUNDAY_SECTION_HEADINGS: Readonly<Record<SundaySectionKey, string>> = {
  golf: 'Golf',
  tracer: 'Disc golf',
};

export const SUNDAY_TIP_LABELS: Readonly<Record<SundayTipKind, string>> = {
  rule: 'A rule',
  drill: 'A practice drill',
  'course management': 'Course management',
};

type NewItemField = 'whyItMatters' | 'published' | 'preview';
type StoredItem = Omit<SundayItem, NewItemField> & Partial<Pick<SundayItem, NewItemField>>;

interface StoredSection extends Omit<SundaySection, 'items'> {
  items: readonly StoredItem[];
}

type NewIssueField = 'editorNote' | 'lead' | 'quickHits' | 'thisWeek' | 'sundayRound';

interface StoredIssue extends Omit<SundayIssue, NewIssueField | 'sections'>, Partial<Pick<SundayIssue, Exclude<NewIssueField, 'lead'>>> {
  lead?: StoredItem | null;
  sections: readonly StoredSection[];
}

export const SUNDAY_NO_EVENTS: string = 'No tour event this week.';

const LINK_FIELDS: readonly string[] = ['sourceLabel', 'sourceUrl'];

function isTextOrMissing(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

function isPreview(value: unknown): value is SundayPreview {
  return isRecord(value) && hasStrings(value, ['title', 'siteName', 'description']) && (value.image === null || typeof value.image === 'string');
}

function isItem(value: unknown): value is StoredItem {
  return (
    isRecord(value) &&
    hasStrings(value, ['headline', 'body', ...LINK_FIELDS]) &&
    isTextOrMissing(value.whyItMatters) &&
    isTextOrMissing(value.published) &&
    (value.preview === undefined || value.preview === null || isPreview(value.preview))
  );
}

function isQuickHit(value: unknown): value is SundayQuickHit {
  return isRecord(value) && hasStrings(value, ['text', ...LINK_FIELDS]);
}

function isEvent(value: unknown): value is SundayEvent {
  return isRecord(value) && hasStrings(value, ['name', 'starts', 'ends', 'venue', 'whyWatch', ...LINK_FIELDS]);
}

export function isTipKind(value: unknown): value is SundayTipKind {
  return Object.keys(SUNDAY_TIP_LABELS).some((kind) => kind === value);
}

function isTip(value: unknown): value is SundayTip {
  return isRecord(value) && isTipKind(value.kind) && hasStrings(value, ['headline', 'body', ...LINK_FIELDS]);
}

function isSection(value: unknown): value is StoredSection {
  return (
    isRecord(value) &&
    (value.key === 'golf' || value.key === 'tracer') &&
    Array.isArray(value.items) &&
    value.items.every(isItem)
  );
}

function isListOrMissing(value: unknown, guard: (entry: unknown) => boolean, nullable: boolean): boolean {
  return value === undefined || (nullable && value === null) || (Array.isArray(value) && value.every(guard));
}

function isOrMissing(value: unknown, guard: (entry: unknown) => boolean): boolean {
  return value === undefined || value === null || guard(value);
}

export function isSundayIssue(value: unknown): value is StoredIssue {
  return (
    isRecord(value) &&
    hasStrings(value, ['slug', 'date', 'title', 'pageTitle', 'summary']) &&
    typeof value.number === 'number' &&
    isTextOrMissing(value.editorNote) &&
    isOrMissing(value.lead, isItem) &&
    isListOrMissing(value.quickHits, isQuickHit, false) &&
    isListOrMissing(value.thisWeek, isEvent, true) &&
    isOrMissing(value.sundayRound, isTip) &&
    Array.isArray(value.sections) &&
    value.sections.every(isSection)
  );
}

function withNulls(item: StoredItem): SundayItem {
  return { ...item, whyItMatters: item.whyItMatters ?? null, published: item.published ?? null, preview: item.preview ?? null };
}

export function parseIssue(json: string, label: string): SundayIssue {
  const value: unknown = JSON.parse(json);
  if (!isSundayIssue(value)) throw new Error(`${label} is not a Sunday issue`);
  const { slug, number, date, title, pageTitle, summary } = value;
  return {
    slug,
    number,
    date,
    title,
    pageTitle,
    summary,
    editorNote: value.editorNote ?? null,
    lead: value.lead === undefined || value.lead === null ? null : withNulls(value.lead),
    quickHits: value.quickHits ?? [],
    thisWeek: value.thisWeek ?? null,
    sundayRound: value.sundayRound ?? null,
    sections: value.sections.map((section) => ({ ...section, items: section.items.map(withNulls) })),
  };
}

export function sortedIssues(issues: readonly SundayIssue[]): readonly SundayIssue[] {
  return [...issues].sort((a, b) => a.number - b.number);
}
