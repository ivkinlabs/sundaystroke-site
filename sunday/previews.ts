import { validated } from './issueCheck.ts';
import { previewFrom } from './openGraph.ts';
import { sourcePage } from './site.ts';
import { statePaths, writeJson } from './state.ts';
import type { SundayItem } from '../src/types/sunday.ts';

async function withPreview(item: SundayItem): Promise<SundayItem> {
  const page = await sourcePage(item.sourceUrl);
  return { ...item, preview: page === null ? null : previewFrom(page.html, page.url, item.sourceLabel) };
}

export async function commandPreview(issueDate: string): Promise<void> {
  const issue = validated(issueDate);
  const sections = await Promise.all(issue.sections.map(async (section) => ({ ...section, items: await Promise.all(section.items.map(withPreview)) })));
  writeJson(statePaths(issueDate).issueFile, { ...issue, sections });
}
