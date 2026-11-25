import { readFileSync, writeFileSync } from 'node:fs';
import { madridDay } from './calendar.ts';
import { previewFrom } from './openGraph.ts';
import { shapeProblems } from './rules.ts';
import { sourcePage } from './site.ts';
import { readCandidates, statePaths } from './state.ts';
import type { Candidate } from './types.ts';
import { parseIssue } from '../src/lib/sundayIssue.ts';
import type { SundayIssue, SundayItem, SundaySection } from '../src/types/sunday.ts';

async function withSource(item: SundayItem, candidate: Candidate | undefined): Promise<SundayItem> {
  if (candidate === undefined) throw new Error(`"${item.headline}" links ${item.sourceUrl}, which is not one of this week's collected stories`);
  const page = await sourcePage(item.sourceUrl);
  const preview = page === null ? null : previewFrom(page.html, page.url, item.sourceLabel);
  console.log(`${preview === null ? 'text card' : 'preview'} ${item.sourceUrl}${page === null ? ' (the page did not open)' : ''}`);
  return { ...item, published: madridDay(new Date(candidate.published)).date, preview };
}

export async function withSources(issue: SundayIssue, candidates: readonly Candidate[]): Promise<SundayIssue> {
  const byUrl = new Map(candidates.map((candidate) => [candidate.link, candidate]));
  const sections: SundaySection[] = [];
  for (const section of issue.sections) {
    const items: SundayItem[] = [];
    for (const item of section.items) items.push(await withSource(item, byUrl.get(item.sourceUrl)));
    sections.push({ ...section, items });
  }
  return { ...issue, sections };
}

export async function commandPreview(issueDate: string): Promise<void> {
  const paths = statePaths(issueDate);
  const json = readFileSync(paths.issueFile, 'utf8');
  const problems = shapeProblems(JSON.parse(json));
  if (problems.length > 0) throw new Error(`${paths.issueFile} has the wrong shape:\n- ${problems.join('\n- ')}`);
  const filled = await withSources(parseIssue(json, paths.issueFile), readCandidates(paths.candidates).candidates);
  writeFileSync(paths.issueFile, `${JSON.stringify(filled, null, 2)}\n`);
}
