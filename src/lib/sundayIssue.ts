import { hasExactKeys, hasStrings, isRecord } from './guards.ts';
import type {
  CurrentIssue,
  LegacyIssue,
  LegacyItem,
  LegacySection,
  SourcePreview,
  SundayIssue,
  SundaySection,
  SundayStory,
} from '../types/sunday.ts';
import type { Clip } from '../types/tutorial.ts';

const HEADER_KEYS: readonly string[] = ['slug', 'date', 'title', 'pageTitle', 'summary'];
const PREVIEW_KEYS: readonly string[] = ['title', 'siteName', 'description', 'image'];
const STORY_KEYS: readonly string[] = ['headline', 'body', 'whyItMatters', 'published', 'sourceLabel', 'sourceUrl', 'preview'];
const STORY_STRINGS: readonly string[] = STORY_KEYS.filter((key) => key !== 'preview');
const ISSUE_KEYS: readonly string[] = ['format', 'number', 'editorsNote', 'sections', ...HEADER_KEYS];

function isClip(value: unknown): value is Clip {
  return isRecord(value) && hasStrings(value, ['src', 'poster', 'label']);
}

function isLegacyItem(value: unknown): value is LegacyItem {
  return isRecord(value) && hasStrings(value, ['headline', 'body', 'sourceLabel', 'sourceUrl']);
}

function isLegacySection(value: unknown): value is LegacySection {
  return (
    isRecord(value) &&
    (value.key === 'golf' || value.key === 'tracer') &&
    typeof value.heading === 'string' &&
    Array.isArray(value.items) &&
    value.items.every(isLegacyItem)
  );
}

export function isSourcePreview(value: unknown): value is SourcePreview {
  return (
    isRecord(value) &&
    hasExactKeys(value, PREVIEW_KEYS) &&
    hasStrings(value, ['title', 'siteName', 'description']) &&
    (value.image === null || typeof value.image === 'string')
  );
}

function isStory(value: unknown): value is SundayStory {
  return (
    isRecord(value) &&
    hasExactKeys(value, STORY_KEYS) &&
    hasStrings(value, STORY_STRINGS) &&
    (value.preview === null || isSourcePreview(value.preview))
  );
}

function isSection(value: unknown): value is SundaySection {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['key', 'items']) &&
    (value.key === 'golf' || value.key === 'discGolf') &&
    Array.isArray(value.items) &&
    value.items.every(isStory)
  );
}

export function isCurrentIssue(value: unknown): value is CurrentIssue {
  return (
    isRecord(value) &&
    hasExactKeys(value, ISSUE_KEYS) &&
    value.format === 2 &&
    hasStrings(value, [...HEADER_KEYS, 'editorsNote']) &&
    typeof value.number === 'number' &&
    Array.isArray(value.sections) &&
    value.sections.every(isSection)
  );
}

type LegacyFile = Omit<LegacyIssue, 'format'>;

function isLegacyFile(value: unknown): value is LegacyFile {
  return (
    isRecord(value) &&
    !('format' in value) &&
    hasStrings(value, [...HEADER_KEYS, 'leadText']) &&
    typeof value.number === 'number' &&
    Array.isArray(value.leadClips) &&
    value.leadClips.every(isClip) &&
    Array.isArray(value.sections) &&
    value.sections.every(isLegacySection)
  );
}

export function parseIssue(json: string, label: string): SundayIssue {
  const value: unknown = JSON.parse(json);
  if (isCurrentIssue(value)) return value;
  if (isLegacyFile(value)) return { format: 1, ...value };
  throw new Error(`${label} is not a Sunday issue`);
}

export function parseCurrentIssue(json: string, label: string): CurrentIssue {
  const issue = parseIssue(json, label);
  if (issue.format !== 2) throw new Error(`${label} is an earlier issue's format; new issues use format 2`);
  return issue;
}

export function sortedIssues<T extends SundayIssue>(issues: readonly T[]): readonly T[] {
  return [...issues].sort((a, b) => a.number - b.number);
}
