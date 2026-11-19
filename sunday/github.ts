import { hasStrings, isRecord } from '../src/lib/guards.ts';
import { parseIssue, sortedIssues } from '../src/lib/sundayIssue.ts';
import { COMMAND_TIMEOUT_MS, gh, git, runRaw } from './exec.ts';
import { SITE_REPO } from './sources.ts';
import { ISSUES_DIR } from './state.ts';
import type { SundayIssue } from '../src/types/sunday.ts';

const MAIN: string = 'origin/main';
const SHA: RegExp = /^[0-9a-f]{40}$/;
export const FACTORY_LABEL: string = 'factory';

export interface PullHead {
  number: number;
  headSha: string;
  files: readonly string[];
}

export function issueBranch(issueDate: string): string {
  return `factory/sunday-${issueDate}`;
}

export function fetchMain(): void {
  git(['fetch', '-q', 'origin', 'main']);
}

interface PullFileJson {
  path: string;
}

interface PullJson {
  number: number;
  headRefOid: string;
  files: readonly PullFileJson[];
}

function isPullFile(value: unknown): value is PullFileJson {
  return isRecord(value) && hasStrings(value, ['path']);
}

function isPullJson(value: unknown): value is PullJson {
  return (
    isRecord(value) &&
    typeof value.number === 'number' &&
    typeof value.headRefOid === 'string' &&
    Array.isArray(value.files) &&
    value.files.every(isPullFile)
  );
}

export function openPull(issueDate: string): PullHead | null {
  const listed: unknown = JSON.parse(gh(['pr', 'list', '--repo', SITE_REPO, '--head', issueBranch(issueDate), '--state', 'open', '--json', 'number,headRefOid,files']));
  if (!Array.isArray(listed)) throw new Error('gh pr list did not answer a list');
  if (listed.length === 0) return null;
  if (listed.length > 1) throw new Error(`more than one open pull request for ${issueBranch(issueDate)}`);
  const pull: unknown = listed[0];
  if (!isPullJson(pull) || !SHA.test(pull.headRefOid)) throw new Error('gh pr list answered an unexpected pull request shape');
  return { number: pull.number, headSha: pull.headRefOid, files: pull.files.map((file) => file.path) };
}

export function filesAt(rev: string, directory: string): readonly string[] {
  return git(['ls-tree', '--name-only', `${rev}:${directory}`]).split('\n').filter((name) => name !== '');
}

export function pathExistsAt(rev: string, path: string): boolean {
  return git(['ls-tree', '--name-only', rev, '--', path]) !== '';
}

export function blobAt(rev: string, path: string): string {
  return runRaw('git', ['show', `${rev}:${path}`], COMMAND_TIMEOUT_MS);
}

export function issuesOnMain(): readonly SundayIssue[] {
  return sortedIssues(
    filesAt(MAIN, ISSUES_DIR)
      .filter((name) => name.endsWith('.json'))
      .map((name) => parseIssue(blobAt(MAIN, `${ISSUES_DIR}/${name}`), name)),
  );
}

export function issueOnMain(issueDate: string): string | null {
  const path = `${ISSUES_DIR}/${issueDate}.json`;
  return pathExistsAt(MAIN, path) ? blobAt(MAIN, path) : null;
}


export function remoteBranchSha(branch: string): string | null {
  const line = git(['ls-remote', 'origin', `refs/heads/${branch}`]);
  if (line === '') return null;
  const sha = line.split(/\s+/)[0] ?? '';
  if (!SHA.test(sha)) throw new Error(`git ls-remote answered "${line}"`);
  return sha;
}
