import { addDays, madridMidnight } from './calendar.ts';
import { parseFeed } from './feeds.ts';
import { fetchText } from './site.ts';
import { ITEM_WINDOW_DAYS, SUNDAY_SOURCES } from './sources.ts';
import { statePaths, writeJson } from './state.ts';
import type { Candidate, CandidateFile, FeedEntry, FeedFailure, FeedSource } from './types.ts';

export interface CollectWindow {
  since: Date;
  until: Date;
}

export function inWindow(entry: FeedEntry, window: CollectWindow): boolean {
  const published = new Date(entry.published);
  return published >= window.since && published <= window.until;
}

export function uniqueByLink(candidates: readonly Candidate[]): readonly Candidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.link)) return false;
    seen.add(candidate.link);
    return true;
  });
}

async function collectSource(source: FeedSource, window: CollectWindow): Promise<Candidate[]> {
  return parseFeed(await fetchText(source.feedUrl))
    .filter((entry) => inWindow(entry, window))
    .map((entry) => ({ ...entry, sourceName: source.name, section: source.section }));
}

export async function commandFind(issueDate: string): Promise<void> {
  const window: CollectWindow = { since: madridMidnight(addDays(issueDate, -ITEM_WINDOW_DAYS)), until: new Date() };
  const collected: Candidate[] = [];
  const failures: FeedFailure[] = [];
  for (const source of SUNDAY_SOURCES) {
    try {
      collected.push(...(await collectSource(source, window)));
    } catch (error) {
      failures.push({ sourceName: source.name, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  const candidates = uniqueByLink(collected);
  if (!candidates.some((candidate) => candidate.section === 'golf')) {
    throw new Error(`no golf stories collected; failures: ${JSON.stringify(failures)}`);
  }
  const file: CandidateFile = { issueDate, collectedAt: window.until.toISOString(), since: window.since.toISOString(), candidates, failures };
  const path = statePaths(issueDate).candidates;
  writeJson(path, file);
  console.log(`${candidates.length} stories since ${file.since} from ${SUNDAY_SOURCES.length - failures.length} of ${SUNDAY_SOURCES.length} feeds -> ${path}`);
  for (const failure of failures) console.log(`feed failed: ${failure.sourceName}: ${failure.reason}`);
}
