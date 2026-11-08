import { hasExactKeys, hasStrings, isRecord } from '../lib/guards.ts';
import type { ItemVerdict } from './types.ts';
import type { SundayIssue } from '../types/sunday.ts';

export interface CheckedIssue {
  issue: SundayIssue;
  rejected: readonly ItemVerdict[];
}

const VERDICT_KEYS: readonly string[] = ['sourceUrl', 'verdict', 'reason'];
const FILE_KEYS: readonly string[] = ['issueDate', 'verdicts'];

function isVerdict(value: unknown): value is ItemVerdict {
  return (
    isRecord(value) &&
    hasExactKeys(value, VERDICT_KEYS) &&
    hasStrings(value, VERDICT_KEYS) &&
    (value.verdict === 'confirmed' || value.verdict === 'rejected')
  );
}

export function itemUrls(issue: SundayIssue): readonly string[] {
  return issue.sections.flatMap((section) => section.items.map((item) => item.sourceUrl));
}

export function parseVerdicts(json: string, issue: SundayIssue): readonly ItemVerdict[] {
  const value: unknown = JSON.parse(json);
  if (!isRecord(value) || !hasExactKeys(value, FILE_KEYS) || !Array.isArray(value.verdicts) || !value.verdicts.every(isVerdict)) {
    throw new Error('the check must answer { issueDate, verdicts: [{ sourceUrl, verdict, reason }] }');
  }
  if (value.issueDate !== issue.slug) throw new Error(`the check answered for ${String(value.issueDate)}, not ${issue.slug}`);
  const verdicts: readonly ItemVerdict[] = value.verdicts;
  const urls = itemUrls(issue);
  const answered = verdicts.map((verdict) => verdict.sourceUrl);
  const duplicates = answered.filter((url, at) => answered.indexOf(url) !== at);
  const missing = urls.filter((url) => !answered.includes(url));
  const extra = answered.filter((url) => !urls.includes(url));
  if (duplicates.length > 0) throw new Error(`the check answered twice for ${duplicates.join(', ')}`);
  if (missing.length > 0) throw new Error(`the check gave no verdict for ${missing.join(', ')}`);
  if (extra.length > 0) throw new Error(`the check answered for items the issue doesn't have: ${extra.join(', ')}`);
  return verdicts;
}

export function applyVerdicts(issue: SundayIssue, verdicts: readonly ItemVerdict[]): CheckedIssue {
  const rejected = verdicts.filter((verdict) => verdict.verdict === 'rejected');
  const rejectedUrls = new Set(rejected.map((verdict) => verdict.sourceUrl));
  const sections = issue.sections
    .map((section) => ({ ...section, items: section.items.filter((item) => !rejectedUrls.has(item.sourceUrl)) }))
    .filter((section) => section.items.length > 0);
  if (sections.length === 0) throw new Error('the check confirmed no item, so there is no issue this week');
  return { issue: { ...issue, sections }, rejected };
}
