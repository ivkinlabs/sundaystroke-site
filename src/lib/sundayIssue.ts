import { hasStrings, isRecord } from './guards.ts';
import type { SundayIssue, SundayItem, SundaySection, SundaySectionKey } from '../types/sunday.ts';

export const SUNDAY_SECTION_HEADINGS: Readonly<Record<SundaySectionKey, string>> = {
  golf: 'Golf',
  tracer: 'Disc golf',
};

function isItem(value: unknown): value is SundayItem {
  return isRecord(value) && hasStrings(value, ['headline', 'body', 'sourceLabel', 'sourceUrl']);
}

function isSection(value: unknown): value is SundaySection {
  return (
    isRecord(value) &&
    (value.key === 'golf' || value.key === 'tracer') &&
    Array.isArray(value.items) &&
    value.items.every(isItem)
  );
}

export function isSundayIssue(value: unknown): value is SundayIssue {
  return (
    isRecord(value) &&
    hasStrings(value, ['slug', 'date', 'title', 'pageTitle', 'summary']) &&
    typeof value.number === 'number' &&
    Array.isArray(value.sections) &&
    value.sections.every(isSection)
  );
}

export function parseIssue(json: string, label: string): SundayIssue {
  const value: unknown = JSON.parse(json);
  if (!isSundayIssue(value)) throw new Error(`${label} is not a Sunday issue`);
  return value;
}

export function sortedIssues(issues: readonly SundayIssue[]): readonly SundayIssue[] {
  return [...issues].sort((a, b) => a.number - b.number);
}
