import { statePaths } from './state.ts';
import type { CheckRecord, FactCheckFact, FactCheckPage, ItemVerdict } from './types.ts';
import type { CurrentIssue } from '../src/types/sunday.ts';

const FENCE: string = '```';

function verdictLine(verdict: ItemVerdict): string {
  return `- ${verdict.sourceUrl}: ${verdict.reason}`;
}

function factCheck(issue: CurrentIssue): readonly FactCheckPage[] {
  const facts = issue.sections.flatMap((section) =>
    section.items.map((item): FactCheckFact => ({ part: 'text', claim: `${item.headline}: ${item.body} Why it matters: ${item.whyItMatters}`, source: item.sourceUrl })),
  );
  return [{ page: statePaths(issue.slug).issueFile, facts }];
}

export function pullBody(issue: CurrentIssue, record: CheckRecord): string {
  const kept = record.verdicts.filter((verdict) => verdict.verdict === 'confirmed');
  const rejected = record.verdicts.filter((verdict) => verdict.verdict === 'rejected');
  return [
    `${issue.title}, dated ${issue.date}. Written by the weekly run and checked item by item against its sources by a second, independent run.`,
    '',
    "## Editor's note",
    `${record.note.verdict === 'confirmed' ? 'Confirmed' : 'Rejected'} by the check: ${record.note.reason}`,
    '',
    `## Kept (${kept.length})`,
    ...kept.map(verdictLine),
    '',
    `## Rejected by the check (${rejected.length})`,
    ...(rejected.length === 0 ? ['None.'] : rejected.map(verdictLine)),
    '',
    '## Fact check',
    `${FENCE}factory-fact-check`,
    JSON.stringify(factCheck(issue), null, 2),
    FENCE,
    '',
    'Goes live once the owner taps Publish on this exact issue.',
  ].join('\n');
}
