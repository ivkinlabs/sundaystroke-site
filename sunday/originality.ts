import { COPIED_RUN_WORDS } from './sources.ts';

function words(text: string): readonly string[] {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .split(/[^\p{L}\p{N}']+/u)
    .filter((word) => word !== '');
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter((word) => word !== '').length;
}

function runs(list: readonly string[]): readonly string[] {
  const found: string[] = [];
  for (let at = 0; at + COPIED_RUN_WORDS <= list.length; at += 1) found.push(list.slice(at, at + COPIED_RUN_WORDS).join(' '));
  return found;
}

export function copiedRun(ours: string, source: string): string | null {
  const sourceRuns = new Set(runs(words(source)));
  return runs(words(ours)).find((run) => sourceRuns.has(run)) ?? null;
}
