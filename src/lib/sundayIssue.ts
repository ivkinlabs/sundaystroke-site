import { hasStrings, isRecord } from './guards.ts';
import type { SundayIssue, SundayItem, SundayPreview, SundaySection, SundaySectionKey } from '../types/sunday.ts';

export const SUNDAY_SECTION_HEADINGS: Readonly<Record<SundaySectionKey, string>> = {
  golf: 'Golf',
  tracer: 'Disc golf',
};

type NewItemField = 'whyItMatters' | 'published' | 'preview';
type StoredItem = Omit<SundayItem, NewItemField> & Partial<Pick<SundayItem, NewItemField>>;

interface StoredSection extends Omit<SundaySection, 'items'> {
  items: readonly StoredItem[];
}

interface StoredIssue extends Omit<SundayIssue, 'editorNote' | 'sections'>, Partial<Pick<SundayIssue, 'editorNote'>> {
  sections: readonly StoredSection[];
}

function isTextOrMissing(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

function isPreview(value: unknown): value is SundayPreview {
  return isRecord(value) && hasStrings(value, ['title', 'siteName', 'description']) && (value.image === null || typeof value.image === 'string');
}

function isItem(value: unknown): value is StoredItem {
  return (
    isRecord(value) &&
    hasStrings(value, ['headline', 'body', 'sourceLabel', 'sourceUrl']) &&
    isTextOrMissing(value.whyItMatters) &&
    isTextOrMissing(value.published) &&
    (value.preview === undefined || value.preview === null || isPreview(value.preview))
  );
}

function isSection(value: unknown): value is StoredSection {
  return (
    isRecord(value) &&
    (value.key === 'golf' || value.key === 'tracer') &&
    Array.isArray(value.items) &&
    value.items.every(isItem)
  );
}

export function isSundayIssue(value: unknown): value is StoredIssue {
  return (
    isRecord(value) &&
    hasStrings(value, ['slug', 'date', 'title', 'pageTitle', 'summary']) &&
    typeof value.number === 'number' &&
    isTextOrMissing(value.editorNote) &&
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
  return { ...value, editorNote: value.editorNote ?? null, sections: value.sections.map((section) => ({ ...section, items: section.items.map(withNulls) })) };
}

export function sortedIssues(issues: readonly SundayIssue[]): readonly SundayIssue[] {
  return [...issues].sort((a, b) => a.number - b.number);
}
