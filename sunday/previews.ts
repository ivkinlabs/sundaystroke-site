import { readFileSync } from 'node:fs';
import { validated } from './issueCheck.ts';
import { previewFrom } from './openGraph.ts';
import { shapeProblems } from './rules.ts';
import { sourcePage } from './site.ts';
import { statePaths, writeJson } from './state.ts';
import { parseIssue } from '../src/lib/sundayIssue.ts';
import type { SundayItem } from '../src/types/sunday.ts';

async function withPreview(item: SundayItem): Promise<SundayItem> {
  const page = await sourcePage(item.sourceUrl);
  return { ...item, preview: page === null ? null : previewFrom(page.html, page.url, item.sourceLabel) };
}

export async function commandPreview(issueDate: string): Promise<void> {
  const { issueFile } = statePaths(issueDate);
  const json = readFileSync(issueFile, 'utf8');
  const shape = shapeProblems(JSON.parse(json));
  if (shape.length > 0) throw new Error(`issue ${issueDate} breaks the rules:\n- ${shape.join('\n- ')}`);
  const issue = parseIssue(json, issueFile);
  const lead = issue.lead === null ? null : await withPreview(issue.lead);
  const sections = await Promise.all(issue.sections.map(async (section) => ({ ...section, items: await Promise.all(section.items.map(withPreview)) })));
  writeJson(issueFile, { ...issue, lead, sections });
  validated(issueDate);
}
