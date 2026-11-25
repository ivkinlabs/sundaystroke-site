import { statePaths } from './state.ts';
import type { CheckRecord, FactCheckFact, FactCheckPage, ItemVerdict } from './types.ts';
import type { SundayIssue } from '../src/types/sunday.ts';

const FENCE: string = '```';

function verdictLine(verdict: ItemVerdict): string {
  return `- ${verdict.sourceUrl}: ${verdict.reason}`;
}

function factCheck(issue: SundayIssue): readonly FactCheckPage[] {
  const facts = issue.sections.flatMap((section) =>
    section.items.map((item): FactCheckFact => ({ part: 'text', claim: [`${item.headline}: ${item.body}`, item.whyItMatters].filter((text) => text !== null).join(' '), source: item.sourceUrl })),
  );
  return [{ page: statePaths(issue.slug).issueFile, facts }];
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
    "## Editor's note",
    issue.editorNote ?? 'None.',
    '',
    "The check confirmed every fact in it against the kept stories' pages.",
    '',
    '## Fact check',
    `${FENCE}factory-fact-check`,
    JSON.stringify(factCheck(issue), null, 2),
    FENCE,
    '',
    'Goes live once the owner taps Publish on this exact issue.',
  ].join('\n');
}
