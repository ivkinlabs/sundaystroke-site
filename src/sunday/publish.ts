import { existsSync } from 'node:fs';
import { parseIssue } from '../lib/sundayIssue.ts';
import { notify } from './exec.ts';
import { blobAt, fetchCommit, fetchMain, issueOnMain, issuesOnMain, mediaOnMain, mergePull, openPull } from './github.ts';
import type { PullHead } from './github.ts';
import { checkedContent } from './issueCheck.ts';
import { issueProblems } from './rules.ts';
import { inSitemap, issueLive, issueUrl, waitFor } from './site.ts';
import { readCandidates, statePaths, writeJson } from './state.ts';
import type { SundayIssue } from '../types/sunday.ts';

const LIVE_TIMEOUT_MS: number = 45 * 60_000;
const SITEMAP_TIMEOUT_MS: number = 15 * 60_000;

export function pullProblems(issueDate: string, pull: PullHead, content: string): readonly string[] {
  const paths = statePaths(issueDate);
  const problems: string[] = [];
  if (pull.files.length !== 1 || pull.files[0] !== paths.issueFile) problems.push(`the pull request must change only ${paths.issueFile}; it changes ${pull.files.join(', ')}`);
  checkedContent(issueDate, content);
  const issue = parseIssue(content, paths.issueFile);
  problems.push(...issueProblems(issue, {
    earlierIssues: issuesOnMain().filter((earlier) => earlier.slug !== issueDate),
    candidates: readCandidates(paths.candidates),
    mediaExists: mediaOnMain,
  }));
  return problems;
}

function mergeChecked(issueDate: string, pull: PullHead): SundayIssue {
  fetchCommit(pull.headSha);
  const content = blobAt(pull.headSha, statePaths(issueDate).issueFile);
  const problems = pullProblems(issueDate, pull, `${content}\n`);
  if (problems.length > 0) throw new Error(`the pull request for ${issueDate} can't be published:\n- ${problems.join('\n- ')}`);
  mergePull(pull);
  return parseIssue(content, issueDate);
}

function publishedIssue(issueDate: string): SundayIssue {
  fetchMain();
  const onMain = issueOnMain(issueDate);
  if (onMain !== null) return parseIssue(onMain, issueDate);
  const pull = openPull(issueDate);
  if (pull === null) throw new Error(`no issue for ${issueDate} on main and no open pull request`);
  return mergeChecked(issueDate, pull);
}

function itemCount(issue: SundayIssue): number {
  return issue.sections.reduce((sum, section) => sum + section.items.length, 0);
}

function alertStuckOnce(issueDate: string, issue: SundayIssue): void {
  const marker = statePaths(issueDate).stuckAlert;
  if (existsSync(marker)) return;
  notify(`<b>The Sunday post, issue ${issue.number}, isn't showing on the site yet.</b> It was published but the site hasn't updated. Nothing needed from you; it is checked again at the next run.`, false);
  writeJson(marker, { issueDate, alertedAt: new Date().toISOString() });
}

export async function commandPublish(issueDate: string): Promise<void> {
  const paths = statePaths(issueDate);
  const issue = publishedIssue(issueDate);
  try {
    await waitFor(issueUrl(issueDate), LIVE_TIMEOUT_MS, () => issueLive(issueDate));
    await waitFor('the sitemap', SITEMAP_TIMEOUT_MS, () => inSitemap(issueDate));
  } catch (error) {
    alertStuckOnce(issueDate, issue);
    throw error;
  }
  notify(`<b>The Sunday post, issue ${issue.number}, is live</b> with ${itemCount(issue)} stories: <a href="${issueUrl(issueDate)}">${issue.date}</a>.`, true);
  writeJson(paths.announced, { issueDate, number: issue.number, announcedAt: new Date().toISOString() });
}

export function commandAlertMissed(issueDate: string): void {
  const marker = statePaths(issueDate).missedAlert;
  if (existsSync(marker)) return;
  notify(`<b>No Sunday post went out on ${issueDate}.</b> The weekly run couldn't publish it. Nothing needed from you; next Sunday's issue runs as usual.`, false);
  writeJson(marker, { issueDate, alertedAt: new Date().toISOString() });
}
