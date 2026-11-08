import type { CheckRecord, ItemVerdict } from './types.ts';
import type { SundayIssue } from '../types/sunday.ts';

function verdictLine(verdict: ItemVerdict): string {
  return `- ${verdict.sourceUrl}: ${verdict.reason}`;
}

export function pullBody(issue: SundayIssue, record: CheckRecord): string {
  const kept = record.verdicts.filter((verdict) => verdict.verdict === 'confirmed');
  const rejected = record.verdicts.filter((verdict) => verdict.verdict === 'rejected');
  return [
    `${issue.title}, dated ${issue.date}. Written by the weekly run and checked item by item against its sources by a second, independent run.`,
    '',
    `## Kept (${kept.length})`,
    ...kept.map(verdictLine),
    '',
    `## Rejected by the check (${rejected.length})`,
    ...(rejected.length === 0 ? ['None.'] : rejected.map(verdictLine)),
    '',
    'Merged on Sunday morning, Madrid time, by the same weekly run.',
  ].join('\n');
}
