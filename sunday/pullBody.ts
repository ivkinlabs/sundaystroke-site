import { statePaths } from './state.ts';
import type { CheckRecord, FactCheckFact, FactCheckPage, ItemVerdict } from './types.ts';
import { SUNDAY_NO_EVENTS } from '../src/lib/sundayIssue.ts';
import { displayRange } from '../src/utils/dates.ts';
import type { SundayEvent, SundayIssue, SundayItem } from '../src/types/sunday.ts';

const FENCE: string = '```';

function verdictLine(verdict: ItemVerdict): string {
  return `- ${verdict.sourceUrl}: ${verdict.reason}`;
}

function fact(claim: string, source: string): FactCheckFact {
  return { part: 'text', claim, source };
}

function storyFact(item: SundayItem): FactCheckFact {
  return fact([`${item.headline}: ${item.body}`, item.whyItMatters].filter((text) => text !== null).join(' '), item.sourceUrl);
}

function eventLine(event: SundayEvent): string {
  return `${event.name}, ${displayRange(event.starts, event.ends)}, ${event.venue}. ${event.whyWatch}`;
}

function factCheck(issue: SundayIssue): readonly FactCheckPage[] {
  const facts = [
    ...(issue.lead === null ? [] : [storyFact(issue.lead)]),
    ...issue.sections.flatMap((section) => section.items.map(storyFact)),
    ...issue.quickHits.map((hit) => fact(hit.text, hit.sourceUrl)),
    ...(issue.thisWeek ?? []).map((event) => fact(eventLine(event), event.sourceUrl)),
    ...(issue.sundayRound === null ? [] : [fact(`${issue.sundayRound.headline}: ${issue.sundayRound.body}`, issue.sundayRound.sourceUrl)]),
  ];
  return [{ page: statePaths(issue.slug).issueFile, facts }];
}

function thisWeekLines(issue: SundayIssue): readonly string[] {
  const events = issue.thisWeek ?? [];
  return events.length === 0 ? [SUNDAY_NO_EVENTS] : events.map((event) => `- ${eventLine(event)}`);
}

export function pullBody(issue: SundayIssue, record: CheckRecord): string {
  const kept = record.verdicts.filter((verdict) => verdict.verdict === 'confirmed');
  const rejected = record.verdicts.filter((verdict) => verdict.verdict === 'rejected');
  return [
    `${issue.title}, dated ${issue.date}. Written by the weekly run and checked item by item against its sources by a second, independent run.`,
    '',
    '## Lead story',
    issue.lead === null ? 'None.' : `**${issue.lead.headline}** (${issue.lead.sourceLabel})`,
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
    '## This week',
    ...thisWeekLines(issue),
    '',
    '## Fact check',
    `${FENCE}factory-fact-check`,
    JSON.stringify(factCheck(issue), null, 2),
    FENCE,
    '',
    'Goes live once the owner taps Publish on this exact issue.',
  ].join('\n');
}
