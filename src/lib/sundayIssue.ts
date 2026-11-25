import { hasStrings, isRecord, type Fields } from './guards.ts';
import { isLegacySectionKey, isSectionKey } from './sundaySections.ts';
import type { CurrentIssue, LegacyIssue, LegacyItem, LegacySection, SundayIssue } from '../types/sunday.ts';
import type { Clip } from '../types/tutorial.ts';

const HEADER_KEYS: readonly string[] = ['slug', 'date', 'title', 'pageTitle', 'summary'];
const PREVIEW_KEYS: readonly string[] = ['title', 'siteName', 'description', 'image'];
const STORY_KEYS: readonly string[] = ['headline', 'body', 'whyItMatters', 'published', 'sourceLabel', 'sourceUrl', 'preview'];
const STORY_STRINGS: readonly string[] = STORY_KEYS.filter((key) => key !== 'preview');
const ISSUE_KEYS: readonly string[] = ['format', 'number', 'editorsNote', 'sections', ...HEADER_KEYS];
const ISSUE_STRINGS: readonly string[] = [...HEADER_KEYS, 'editorsNote'];

type Problem = string | null;

function keyProblem(value: Fields, keys: readonly string[], strings: readonly string[], path: string): Problem {
  const missing = keys.filter((key) => !(key in value));
  if (missing.length > 0) return `${path}: missing ${missing.join(', ')}`;
  const extra = Object.keys(value).filter((key) => !keys.includes(key));
  if (extra.length > 0) return `${path}: unexpected ${extra.join(', ')}`;
  const notText = strings.filter((key) => typeof value[key] !== 'string');
  return notText.length > 0 ? `${path}: ${notText.join(', ')} must be text` : null;
}

function firstProblem(values: readonly unknown[], path: string, check: (value: unknown, path: string) => Problem): Problem {
  for (const [at, value] of values.entries()) {
    const problem = check(value, `${path}[${at}]`);
    if (problem !== null) return problem;
  }
  return null;
}

function previewProblem(value: unknown, path: string): Problem {
  if (value === null) return null;
  if (!isRecord(value)) return `${path}: must be a preview or null`;
  const keys = keyProblem(value, PREVIEW_KEYS, ['title', 'siteName', 'description'], path);
  if (keys !== null) return keys;
  return value.image === null || typeof value.image === 'string' ? null : `${path}.image: must be an address or null`;
}

function storyProblem(value: unknown, path: string): Problem {
  if (!isRecord(value)) return `${path}: must be a story`;
  return keyProblem(value, STORY_KEYS, STORY_STRINGS, path) ?? previewProblem(value.preview, `${path}.preview`);
}

function sectionProblem(value: unknown, path: string): Problem {
  if (!isRecord(value)) return `${path}: must be a section`;
  const keys = keyProblem(value, ['key', 'items'], [], path);
  if (keys !== null) return keys;
  if (!isSectionKey(value.key)) return `${path}.key: must be golf or discGolf`;
  if (!Array.isArray(value.items)) return `${path}.items: must be a list`;
  return firstProblem(value.items, `${path}.items`, storyProblem);
}

function currentIssueProblem(value: Fields): Problem {
  const keys = keyProblem(value, ISSUE_KEYS, ISSUE_STRINGS, 'issue');
  if (keys !== null) return keys;
  if (typeof value.number !== 'number') return 'issue.number: must be a number';
  if (!Array.isArray(value.sections)) return 'issue.sections: must be a list';
  return firstProblem(value.sections, 'sections', sectionProblem);
}

function isCurrentIssue(value: unknown): value is CurrentIssue {
  return isRecord(value) && value.format === 2 && currentIssueProblem(value) === null;
}

function isClip(value: unknown): value is Clip {
  return isRecord(value) && hasStrings(value, ['src', 'poster', 'label']);
}

function isLegacyItem(value: unknown): value is LegacyItem {
  return isRecord(value) && hasStrings(value, ['headline', 'body', 'sourceLabel', 'sourceUrl']);
}

function isLegacySection(value: unknown): value is LegacySection {
  return isRecord(value) && isLegacySectionKey(value.key) && typeof value.heading === 'string' && Array.isArray(value.items) && value.items.every(isLegacyItem);
}

type LegacyFile = Omit<LegacyIssue, 'format'>;

function isLegacyFile(value: Fields): value is LegacyFile {
  return (
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
  if (!isRecord(value)) throw new Error(`${label} is not a Sunday issue`);
  if (!('format' in value)) {
    if (isLegacyFile(value)) return { format: 1, ...value };
    throw new Error(`${label} has no format and is not an earlier issue; new issues use "format": 2`);
  }
  if (value.format !== 2) throw new Error(`${label}: format must be 2`);
  const problem = currentIssueProblem(value);
  if (problem !== null || !isCurrentIssue(value)) throw new Error(`${label} is not a Sunday issue: ${problem ?? 'unreadable'}`);
  return value;
}

export function parseCurrentIssue(json: string, label: string): CurrentIssue {
  const issue = parseIssue(json, label);
  if (issue.format !== 2) throw new Error(`${label} is an earlier issue's format; new issues use format 2`);
  return issue;
}

export function sortedIssues<T extends SundayIssue>(issues: readonly T[]): readonly T[] {
  return [...issues].sort((a, b) => a.number - b.number);
}
