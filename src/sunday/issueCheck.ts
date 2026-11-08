import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseIssue, sortedIssues } from '../lib/sundayIssue.ts';
import { runChecker, replyJson } from './checker.ts';
import { git, gh } from './exec.ts';
import { fetchMain, issueBranch, openPull, remoteBranchSha } from './github.ts';
import { pullBody } from './pullBody.ts';
import { issueProblems } from './rules.ts';
import { DEAD_LINK_STATUSES, pageStatus } from './site.ts';
import { SITE_REPO } from './sources.ts';
import { ISSUES_DIR, readCandidates, readCheckRecord, sha256, statePaths, writeJson } from './state.ts';
import type { CheckRecord, ItemVerdict } from './types.ts';
import { applyVerdicts, itemUrls, parseVerdicts } from './verdicts.ts';
import type { SundayIssue } from '../types/sunday.ts';

function localIssues(): readonly SundayIssue[] {
  return sortedIssues(
    readdirSync(ISSUES_DIR)
      .filter((name) => name.endsWith('.json'))
      .map((name) => parseIssue(readFileSync(join(ISSUES_DIR, name), 'utf8'), name)),
  );
}

function changedFiles(): readonly string[] {
  fetchMain();
  const tracked = git(['diff', '--name-only', 'origin/main']);
  const untracked = git(['ls-files', '--others', '--exclude-standard']);
  return `${tracked}\n${untracked}`.split('\n').map((line) => line.trim()).filter((line) => line !== '');
}

export function validated(issueDate: string): SundayIssue {
  const paths = statePaths(issueDate);
  const issues = localIssues();
  const issue = issues.find((candidate) => candidate.slug === issueDate);
  if (issue === undefined) throw new Error(`no issue file ${paths.issueFile}`);
  const problems = [...issueProblems(issue, {
    earlierIssues: issues.filter((earlier) => earlier.slug !== issueDate),
    candidates: readCandidates(paths.candidates),
    mediaExists: (sitePath) => existsSync(join('public', sitePath)),
  })];
  const others = changedFiles().filter((file) => file !== paths.issueFile);
  if (others.length > 0) problems.push(`only ${paths.issueFile} may change; also changed: ${others.join(', ')}`);
  if (problems.length > 0) throw new Error(`issue ${issueDate} breaks the rules:\n- ${problems.join('\n- ')}`);
  return issue;
}

export function commandValidate(issueDate: string): void {
  const issue = validated(issueDate);
  console.log(`issue ${issue.number} (${issue.slug}) follows the rules`);
}

async function deadLinks(issue: SundayIssue): Promise<readonly ItemVerdict[]> {
  const dead: ItemVerdict[] = [];
  for (const url of itemUrls(issue)) {
    const status = await pageStatus(url);
    if (DEAD_LINK_STATUSES.has(status)) dead.push({ sourceUrl: url, verdict: 'rejected', reason: `the link answered ${status}` });
  }
  return dead;
}

function combined(checker: readonly ItemVerdict[], dead: readonly ItemVerdict[]): readonly ItemVerdict[] {
  const deadUrls = new Set(dead.map((verdict) => verdict.sourceUrl));
  return [...dead, ...checker.filter((verdict) => !deadUrls.has(verdict.sourceUrl))];
}

export async function commandCheck(issueDate: string): Promise<void> {
  const paths = statePaths(issueDate);
  const issue = validated(issueDate);
  const dead = await deadLinks(issue);
  const verdicts = combined(parseVerdicts(replyJson(runChecker(issue, readCandidates(paths.candidates))), issue), dead);
  const checked = applyVerdicts(issue, verdicts);
  const content = `${JSON.stringify(checked.issue, null, 2)}\n`;
  writeFileSync(paths.issueFile, content);
  validated(issueDate);
  const record: CheckRecord = { issueDate, issueHash: sha256(content), checkedAt: new Date().toISOString(), verdicts };
  writeJson(paths.check, record);
  for (const verdict of verdicts) console.log(`${verdict.verdict} ${verdict.sourceUrl}: ${verdict.reason}`);
}

export function checkedContent(issueDate: string, content: string): CheckRecord {
  const record = readCheckRecord(statePaths(issueDate).check);
  if (record.issueDate !== issueDate || record.issueHash !== sha256(content)) {
    throw new Error(`the issue for ${issueDate} changed after its source check`);
  }
  return record;
}

export function commandOpenPull(issueDate: string): void {
  const paths = statePaths(issueDate);
  const issue = validated(issueDate);
  const content = readFileSync(paths.issueFile, 'utf8');
  const record = checkedContent(issueDate, content);
  if (openPull(issueDate) !== null) {
    console.log(`a pull request for ${issueBranch(issueDate)} is already open`);
    return;
  }
  const branch = issueBranch(issueDate);
  if (remoteBranchSha(branch) !== null) git(['push', '-q', 'origin', '--delete', branch]);
  git(['switch', '-c', branch]);
  git(['add', paths.issueFile]);
  git(['commit', '-q', '-m', `The Sunday post, issue ${issue.number}`]);
  git(['push', '-q', '-u', 'origin', `HEAD:refs/heads/${branch}`]);
  gh(['pr', 'create', '--repo', SITE_REPO, '--base', 'main', '--head', branch, '--title', `The Sunday post, issue ${issue.number} (${issueDate})`, '--body', pullBody(issue, record)]);
}
