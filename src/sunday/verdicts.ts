import type { ItemVerdict, VerdictFile } from './types.ts';
import type { SundayIssue } from '../types/sunday.ts';

export interface CheckedIssue {
  issue: SundayIssue;
  rejected: readonly ItemVerdict[];
}

const VERDICT_KINDS: ReadonlySet<string> = new Set(['confirmed', 'rejected']);

function isVerdict(value: unknown): value is ItemVerdict {
  if (typeof value !== 'object' || value === null) return false;
  const fields: Readonly<Record<string, unknown>> = Object.fromEntries(Object.entries(value));
  return (
    typeof fields.sourceUrl === 'string' &&
    typeof fields.reason === 'string' &&
    typeof fields.verdict === 'string' &&
    VERDICT_KINDS.has(fields.verdict)
  );
}

export function parseVerdicts(json: string): VerdictFile {
  const value: unknown = JSON.parse(json);
  if (typeof value !== 'object' || value === null) throw new Error('verdicts are not an object');
  const fields: Readonly<Record<string, unknown>> = Object.fromEntries(Object.entries(value));
  const { issueDate, verdicts } = fields;
  if (typeof issueDate !== 'string' || !Array.isArray(verdicts) || !verdicts.every(isVerdict)) {
    throw new Error('verdicts need issueDate and a list of { sourceUrl, verdict, reason }');
  }
  return { issueDate, verdicts };
}

export function applyVerdicts(issue: SundayIssue, file: VerdictFile): CheckedIssue {
  if (file.issueDate !== issue.slug) throw new Error(`verdicts are for ${file.issueDate}, not ${issue.slug}`);
  const byUrl = new Map(file.verdicts.map((verdict) => [verdict.sourceUrl, verdict]));
  const urls = issue.sections.flatMap((section) => section.items.map((item) => item.sourceUrl));
  const missing = urls.filter((url) => !byUrl.has(url));
  if (missing.length > 0) throw new Error(`no verdict for ${missing.join(', ')}`);
  const rejected = urls.flatMap((url) => {
    const verdict = byUrl.get(url);
    return verdict !== undefined && verdict.verdict === 'rejected' ? [verdict] : [];
  });
  const rejectedUrls = new Set(rejected.map((verdict) => verdict.sourceUrl));
  const sections = issue.sections
    .map((section) => ({ ...section, items: section.items.filter((item) => !rejectedUrls.has(item.sourceUrl)) }))
    .filter((section) => section.items.length > 0);
  if (sections.length === 0) throw new Error('the check confirmed no item, so there is no issue this week');
  return { issue: { ...issue, sections }, rejected };
}
