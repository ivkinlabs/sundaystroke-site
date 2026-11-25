import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { hasExactKeys, hasStrings, isRecord } from '../src/lib/guards.ts';
import { currentSectionKey, isLegacySectionKey, isSectionKey } from '../src/lib/sundaySections.ts';
import { isNoteVerdict, isVerdict } from './verdicts.ts';
import type { LegacySectionKey } from '../src/types/sunday.ts';
import type { Candidate, CandidateFile, CheckRecord, FeedFailure } from './types.ts';

export const STATE_ROOT: string = join(homedir(), 'Library', 'Application Support', 'sundaystroke-sunday');
export const REPORT_MARKER: string = join(STATE_ROOT, 'pilot-report.json');
const LOCK_PATH: string = join(STATE_ROOT, 'run.lock');
const STALE_LOCK_MS: number = 3 * 60 * 60_000;
export const ISSUES_DIR: string = join('src', 'data', 'sunday');

export interface StatePaths {
  dir: string;
  candidates: string;
  check: string;
  checked: string;
  confirmedNothing: string;
  issueFile: string;
}

export function statePaths(issueDate: string): StatePaths {
  const dir = join(STATE_ROOT, issueDate);
  return {
    dir,
    candidates: join(dir, 'candidates.json'),
    check: join(dir, 'check.json'),
    checked: join(dir, 'checked-issue.json'),
    confirmedNothing: join(dir, 'confirmed-nothing.json'),
    issueFile: join(ISSUES_DIR, `${issueDate}.json`),
  };
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function readJson(path: string, missing: string): unknown {
  if (!existsSync(path)) throw new Error(missing);
  return JSON.parse(readFileSync(path, 'utf8'));
}

const CANDIDATE_KEYS: readonly string[] = ['title', 'link', 'published', 'excerpt', 'sourceName', 'section'];

type StoredCandidate = Omit<Candidate, 'section'> & { section: Candidate['section'] | LegacySectionKey };

function isStoredCandidate(value: unknown): value is StoredCandidate {
  return (
    isRecord(value) &&
    hasExactKeys(value, CANDIDATE_KEYS) &&
    hasStrings(value, CANDIDATE_KEYS) &&
    (isSectionKey(value.section) || isLegacySectionKey(value.section))
  );
}

function candidateOf(stored: StoredCandidate): Candidate {
  return { ...stored, section: currentSectionKey(stored.section) };
}

function isFailure(value: unknown): value is FeedFailure {
  return isRecord(value) && hasExactKeys(value, ['sourceName', 'reason']) && hasStrings(value, ['sourceName', 'reason']);
}

export function readCandidates(path: string): CandidateFile {
  const value = readJson(path, `no candidates at ${path}; run find first`);
  if (
    !isRecord(value) ||
    !hasStrings(value, ['issueDate', 'collectedAt', 'since']) ||
    !Array.isArray(value.candidates) ||
    !value.candidates.every(isStoredCandidate) ||
    !Array.isArray(value.failures) ||
    !value.failures.every(isFailure)
  ) {
    throw new Error(`${path} is not a candidates file`);
  }
  return { issueDate: String(value.issueDate), collectedAt: String(value.collectedAt), since: String(value.since), candidates: value.candidates.map(candidateOf), failures: value.failures };
}

export function readCheckRecord(path: string): CheckRecord {
  const value = readJson(path, `the issue was never checked (no ${path})`);
  if (
    !isRecord(value) ||
    !hasStrings(value, ['issueDate', 'issueHash', 'checkedAt']) ||
    !isNoteVerdict(value.note) ||
    !Array.isArray(value.verdicts) ||
    !value.verdicts.every(isVerdict)
  ) {
    throw new Error(`${path} is not a check record`);
  }
  return { issueDate: String(value.issueDate), issueHash: String(value.issueHash), checkedAt: String(value.checkedAt), note: value.note, verdicts: value.verdicts };
}

export async function withLock<T>(work: () => Promise<T>): Promise<T> {
  mkdirSync(STATE_ROOT, { recursive: true });
  if (existsSync(LOCK_PATH) && Date.now() - statSync(LOCK_PATH).mtimeMs > STALE_LOCK_MS) rmSync(LOCK_PATH);
  const handle = openSync(LOCK_PATH, 'wx');
  try {
    writeFileSync(handle, `${process.pid}\n`);
    return await work();
  } finally {
    closeSync(handle);
    rmSync(LOCK_PATH);
  }
}
