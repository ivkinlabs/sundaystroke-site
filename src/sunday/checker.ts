import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from './exec.ts';
import { CHECKER_MODEL } from './sources.ts';
import type { CandidateFile } from './types.ts';
import type { SundayIssue } from '../types/sunday.ts';

const CHECKER_PROMPT: string = join('automation', 'sunday-check.md');
const CHECKER_TIMEOUT_MS: number = 40 * 60_000;
const FENCED: RegExp = /```(?:json)?\s*([\s\S]*?)```\s*$/;

export function checkerPrompt(instructions: string, issue: SundayIssue, candidates: CandidateFile): string {
  const urls = new Set(issue.sections.flatMap((section) => section.items.map((item) => item.sourceUrl)));
  const stories = candidates.candidates.filter((candidate) => urls.has(candidate.link));
  return `${instructions}\n\n## The issue\n\n${JSON.stringify(issue, null, 2)}\n\n## The collected stories it uses\n\n${JSON.stringify(stories, null, 2)}\n`;
}

export function replyJson(reply: string): string {
  const trimmed = reply.trim();
  const fenced = FENCED.exec(trimmed);
  return fenced?.[1] !== undefined ? fenced[1].trim() : trimmed;
}

export function runChecker(issue: SundayIssue, candidates: CandidateFile): string {
  const prompt = checkerPrompt(readFileSync(CHECKER_PROMPT, 'utf8'), issue, candidates);
  const room = mkdtempSync(join(tmpdir(), 'sunday-check-'));
  try {
    return run(
      'claude',
      ['-p', '--model', CHECKER_MODEL, '--restricted', '--strict-mcp-config', '--tools', 'WebFetch', '--allowedTools', 'WebFetch', '--output-format', 'text'],
      CHECKER_TIMEOUT_MS,
      prompt,
      room,
    );
  } finally {
    rmSync(room, { recursive: true, force: true });
  }
}
