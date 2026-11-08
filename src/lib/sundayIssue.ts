import { hasStrings, isRecord } from './guards.ts';
import type { SundayIssue, SundayItem, SundaySection } from '../types/sunday.ts';
import type { Clip } from '../types/tutorial.ts';

function isClip(value: unknown): value is Clip {
  return isRecord(value) && hasStrings(value, ['src', 'poster', 'label']);
}

function isItem(value: unknown): value is SundayItem {
  return isRecord(value) && hasStrings(value, ['headline', 'body', 'sourceLabel', 'sourceUrl']);
}

function isSection(value: unknown): value is SundaySection {
  return (
    isRecord(value) &&
    (value.key === 'golf' || value.key === 'tracer') &&
    typeof value.heading === 'string' &&
    Array.isArray(value.items) &&
    value.items.every(isItem)
  );
}

export function isSundayIssue(value: unknown): value is SundayIssue {
  return (
    isRecord(value) &&
    hasStrings(value, ['slug', 'date', 'title', 'pageTitle', 'summary', 'leadText']) &&
    typeof value.number === 'number' &&
    Array.isArray(value.leadClips) &&
    value.leadClips.every(isClip) &&
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
