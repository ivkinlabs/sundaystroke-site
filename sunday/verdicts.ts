import { hasExactKeys, hasStrings, isRecord } from '../src/lib/guards.ts';
import { MIN_QUICK_HITS } from './sources.ts';
import type { CheckReply, ItemVerdict, NoteVerdict } from './types.ts';
import type { SourceCredit, SundayIssue } from '../src/types/sunday.ts';

export interface CheckedIssue {
  issue: SundayIssue;
  rejected: readonly ItemVerdict[];
}

const VERDICT_KEYS: readonly string[] = ['sourceUrl', 'verdict', 'reason'];
const NOTE_KEYS: readonly string[] = ['verdict', 'reason'];
const FILE_KEYS: readonly string[] = ['issueDate', 'editorNote', 'thisWeek', 'verdicts'];

function isVerdict(value: unknown): value is ItemVerdict {
  return (
    isRecord(value) &&
    hasExactKeys(value, VERDICT_KEYS) &&
    hasStrings(value, VERDICT_KEYS) &&
    (value.verdict === 'confirmed' || value.verdict === 'rejected')
  );
}

function isNoteVerdict(value: unknown): value is NoteVerdict {
  return isRecord(value) && hasExactKeys(value, NOTE_KEYS) && hasStrings(value, NOTE_KEYS) && (value.verdict === 'confirmed' || value.verdict === 'rejected');
}

export function itemUrls(issue: SundayIssue): readonly string[] {
  return [
    ...(issue.lead === null ? [] : [issue.lead.sourceUrl]),
    ...issue.sections.flatMap((section) => section.items.map((item) => item.sourceUrl)),
    ...issue.quickHits.map((hit) => hit.sourceUrl),
    ...(issue.sundayRound === null ? [] : [issue.sundayRound.sourceUrl]),
  ];
}

export function parseVerdicts(json: string, issue: SundayIssue): CheckReply {
  const value: unknown = JSON.parse(json);
  if (
    !isRecord(value) ||
    !hasExactKeys(value, FILE_KEYS) ||
    !isNoteVerdict(value.editorNote) ||
    !isNoteVerdict(value.thisWeek) ||
    !Array.isArray(value.verdicts) ||
    !value.verdicts.every(isVerdict)
  ) {
    throw new Error('the check must answer { issueDate, editorNote: { verdict, reason }, thisWeek: { verdict, reason }, verdicts: [{ sourceUrl, verdict, reason }] }');
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
  return { editorNote: value.editorNote, thisWeek: value.thisWeek, verdicts };
}

export function eventUrls(issue: SundayIssue): readonly string[] {
  return [...new Set((issue.thisWeek ?? []).map((event) => event.sourceUrl))];
}

export function confirmsNothing(verdicts: readonly ItemVerdict[]): boolean {
  return verdicts.every((verdict) => verdict.verdict === 'rejected');
}

export function withoutItems(issue: SundayIssue, verdicts: readonly ItemVerdict[]): SundayIssue {
  const dropped = new Set(verdicts.map((verdict) => verdict.sourceUrl));
  const kept = <T extends SourceCredit>(entry: T | null): T | null => (entry === null || dropped.has(entry.sourceUrl) ? null : entry);
  const sections = issue.sections
    .map((section) => ({ ...section, items: section.items.filter((item) => !dropped.has(item.sourceUrl)) }))
    .filter((section) => section.items.length > 0);
  return {
    ...issue,
    lead: kept(issue.lead),
    quickHits: issue.quickHits.filter((hit) => !dropped.has(hit.sourceUrl)),
    sundayRound: kept(issue.sundayRound),
    sections,
  };
}

export function applyVerdicts(issue: SundayIssue, verdicts: readonly ItemVerdict[]): CheckedIssue {
  const rejected = verdicts.filter((verdict) => verdict.verdict === 'rejected');
  const checked = withoutItems(issue, rejected);
  if (itemUrls(checked).length === 0) throw new Error('the check confirmed no item, so there is no issue this week');
  const why = (url: string | undefined): string => rejected.find((verdict) => verdict.sourceUrl === url)?.reason ?? '';
  if (checked.lead === null) throw new Error(`the check rejected the lead story: ${why(issue.lead?.sourceUrl)}`);
  if (checked.sundayRound === null) throw new Error(`the check rejected the Sunday round tip: ${why(issue.sundayRound?.sourceUrl)}`);
  if (checked.quickHits.length < MIN_QUICK_HITS) throw new Error(`the check left ${checked.quickHits.length} quick hits; at least ${MIN_QUICK_HITS} are needed`);
  return { issue: checked, rejected };
}
