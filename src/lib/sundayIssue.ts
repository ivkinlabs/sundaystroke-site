import { hasStrings, isRecord } from './guards.ts';
import type { Fields } from './guards.ts';
import type { SundayIssue, SundayItem, SundaySection, SundaySectionKey } from '../types/sunday.ts';

export const SUNDAY_SECTION_HEADINGS: Readonly<Record<SundaySectionKey, string>> = {
  golf: 'Golf',
  tracer: 'Disc golf',
};

export const SUNDAY_SECTION_ANCHORS: Readonly<Record<SundaySectionKey, string>> = {
  golf: 'golf',
  tracer: 'disc-golf',
};

const ITEM_STRINGS: readonly string[] = ['headline', 'body', 'sourceLabel', 'sourceUrl'];
const ISSUE_STRINGS: readonly string[] = ['slug', 'date', 'title', 'pageTitle', 'summary'];

function fail(label: string, reason: string): never {
  throw new Error(`${label} is not a Sunday issue: ${reason}`);
}

function textOrNull(fields: Fields, key: string, label: string): string | null {
  const value = fields[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') fail(label, `${key} must be text or null`);
  return value;
}

function readItem(value: unknown, label: string): SundayItem {
  if (!isRecord(value) || !hasStrings(value, ITEM_STRINGS)) fail(label, `each item needs ${ITEM_STRINGS.join(', ')}`);
  return {
    headline: String(value.headline),
    body: String(value.body),
    whyItMatters: textOrNull(value, 'whyItMatters', label),
    sourceLabel: String(value.sourceLabel),
    sourceUrl: String(value.sourceUrl),
    published: textOrNull(value, 'published', label),
  };
}

function readSection(value: unknown, label: string): SundaySection {
  if (!isRecord(value) || (value.key !== 'golf' && value.key !== 'tracer') || !Array.isArray(value.items)) {
    fail(label, 'each section needs a golf or tracer key and items');
  }
  const items: readonly unknown[] = value.items;
  return { key: value.key, items: items.map((item) => readItem(item, label)) };
}

export function readIssue(value: unknown, label: string): SundayIssue {
  if (!isRecord(value) || !hasStrings(value, ISSUE_STRINGS) || typeof value.number !== 'number' || !Array.isArray(value.sections)) {
    fail(label, `the issue needs ${ISSUE_STRINGS.join(', ')}, a number and sections`);
  }
  const sections: readonly unknown[] = value.sections;
  return {
    slug: String(value.slug),
    number: value.number,
    date: String(value.date),
    title: String(value.title),
    pageTitle: String(value.pageTitle),
    summary: String(value.summary),
    editorNote: textOrNull(value, 'editorNote', label),
    sections: sections.map((section) => readSection(section, label)),
  };
}

export function parseIssue(json: string, label: string): SundayIssue {
  return readIssue(JSON.parse(json), label);
}

export function sortedIssues(issues: readonly SundayIssue[]): readonly SundayIssue[] {
  return [...issues].sort((a, b) => a.number - b.number);
}
