import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { hasExactKeys, hasStrings, isRecord } from '../lib/guards.ts';
import type { Candidate, CandidateFile, CheckRecord, FeedFailure, ItemVerdict } from './types.ts';

export const STATE_ROOT: string = join(homedir(), 'Library', 'Application Support', 'sundaystroke-sunday');
export const REPORT_MARKER: string = join(STATE_ROOT, 'pilot-report.json');
const LOCK_PATH: string = join(STATE_ROOT, 'run.lock');
const STALE_LOCK_MS: number = 3 * 60 * 60_000;
export const ISSUES_DIR: string = join('src', 'data', 'sunday');

export interface StatePaths {
  dir: string;
  candidates: string;
  check: string;
  announced: string;
  missedAlert: string;
  stuckAlert: string;
  issueFile: string;
}

export function statePaths(issueDate: string): StatePaths {
  const dir = join(STATE_ROOT, issueDate);
  return {
    dir,
    candidates: join(dir, 'candidates.json'),
    check: join(dir, 'check.json'),
    announced: join(dir, 'announced.json'),
    missedAlert: join(dir, 'missed-alerted.json'),
    stuckAlert: join(dir, 'stuck-alerted.json'),
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

function isCandidate(value: unknown): value is Candidate {
  return isRecord(value) && hasExactKeys(value, CANDIDATE_KEYS) && hasStrings(value, CANDIDATE_KEYS) && (value.section === 'golf' || value.section === 'tracer');
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
    !value.candidates.every(isCandidate) ||
    !Array.isArray(value.failures) ||
    !value.failures.every(isFailure)
  ) {
    throw new Error(`${path} is not a candidates file`);
  }
  return { issueDate: String(value.issueDate), collectedAt: String(value.collectedAt), since: String(value.since), candidates: value.candidates, failures: value.failures };
}

function isVerdict(value: unknown): value is ItemVerdict {
  return isRecord(value) && hasStrings(value, ['sourceUrl', 'reason']) && (value.verdict === 'confirmed' || value.verdict === 'rejected');
}

export function readCheckRecord(path: string): CheckRecord {
  const value = readJson(path, `the issue was never checked (no ${path})`);
  if (!isRecord(value) || !hasStrings(value, ['issueDate', 'issueHash', 'checkedAt']) || !Array.isArray(value.verdicts) || !value.verdicts.every(isVerdict)) {
    throw new Error(`${path} is not a check record`);
  }
  return { issueDate: String(value.issueDate), issueHash: String(value.issueHash), checkedAt: String(value.checkedAt), verdicts: value.verdicts };
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
