import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { addDays, madridDay, madridMidnight } from './calendar.ts';
import { parseFeed } from './feeds.ts';
import { parseIssue, sortedIssues } from './issueGuard.ts';
import { issueDateFor, plan } from './plan.ts';
import { issueProblems } from './rules.ts';
import { FACTORY_APP, ITEM_WINDOW_DAYS, SITE_ORIGIN, SITE_REPO, SUNDAY_SOURCES } from './sources.ts';
import type { Candidate, CandidateFile, FeedFailure, FeedSource, ItemVerdict } from './types.ts';
import { applyVerdicts, parseVerdicts } from './verdicts.ts';
import type { SundayIssue } from '../types/sunday.ts';

const STATE_ROOT: string = join(homedir(), 'Library', 'Application Support', 'sundaystroke-sunday');
const ISSUES_DIR: string = join('src', 'data', 'sunday');
const PUBLIC_DIR: string = 'public';
const USER_AGENT: string = 'SundayStrokeSundayPost/1.0 (+https://sundaystroke.com/sunday/)';
const FETCH_TIMEOUT_MS: number = 20_000;
const DEPLOY_TIMEOUT_MS: number = 30 * 60_000;
const LIVE_TIMEOUT_MS: number = 15 * 60_000;
const POLL_MS: number = 20_000;

interface StatePaths {
  dir: string;
  candidates: string;
  verdicts: string;
  published: string;
  missedAlert: string;
  issueFile: string;
}

function statePaths(issueDate: string): StatePaths {
  const dir = join(STATE_ROOT, issueDate);
  return {
    dir,
    candidates: join(dir, 'candidates.json'),
    verdicts: join(dir, 'verdicts.json'),
    published: join(dir, 'published.json'),
    missedAlert: join(dir, 'missed-alerted.json'),
    issueFile: join(ISSUES_DIR, `${issueDate}.json`),
  };
}

const REPORT_MARKER: string = join(STATE_ROOT, 'pilot-report.json');

function argument(args: readonly string[], name: string): string {
  const at = args.indexOf(`--${name}`);
  const value = at >= 0 ? args[at + 1] : undefined;
  if (value === undefined || value.startsWith('--')) throw new Error(`--${name} is required`);
  return value;
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readIssues(): readonly SundayIssue[] {
  return sortedIssues(
    readdirSync(ISSUES_DIR)
      .filter((name) => name.endsWith('.json'))
      .map((name) => parseIssue(readFileSync(join(ISSUES_DIR, name), 'utf8'), name)),
  );
}

function readCandidates(path: string): CandidateFile {
  if (!existsSync(path)) throw new Error(`no candidates at ${path}; run find first`);
  const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (typeof value !== 'object' || value === null || !('candidates' in value) || !('issueDate' in value)) {
    throw new Error(`${path} is not a candidates file`);
  }
  const { issueDate, collectedAt, since, candidates, failures } = Object.fromEntries(Object.entries(value));
  if (typeof issueDate !== 'string' || typeof collectedAt !== 'string' || typeof since !== 'string' || !Array.isArray(candidates) || !Array.isArray(failures)) {
    throw new Error(`${path} is not a candidates file`);
  }
  const typed: Candidate[] = candidates.filter((candidate): candidate is Candidate =>
    typeof candidate === 'object' && candidate !== null && 'link' in candidate && 'sourceName' in candidate && 'section' in candidate);
  const failed: FeedFailure[] = failures.filter((failure): failure is FeedFailure =>
    typeof failure === 'object' && failure !== null && 'sourceName' in failure && 'reason' in failure);
  return { issueDate, collectedAt, since, candidates: typed, failures: failed };
}

async function fetchStatus(url: string): Promise<number> {
  try {
    const response = await fetch(url, { headers: { 'user-agent': USER_AGENT }, redirect: 'follow', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    await response.body?.cancel();
    return response.status;
  } catch {
    return 0;
  }
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT }, redirect: 'follow', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.text();
}

function bust(url: string): string {
  return `${url}?e2e=${Date.now()}`;
}

function issueUrl(issueDate: string): string {
  return `${SITE_ORIGIN}/sunday/${issueDate}/`;
}

async function issueLive(issueDate: string): Promise<boolean> {
  return (await fetchStatus(bust(issueUrl(issueDate)))) === 200;
}

function gh(args: readonly string[]): string {
  return execFileSync('gh', [...args], { encoding: 'utf8' }).trim();
}

function openPull(issueDate: string): number | null {
  const found = gh(['pr', 'list', '--repo', SITE_REPO, '--head', `sunday/${issueDate}`, '--state', 'open', '--json', 'number', '--jq', '.[0].number // empty']);
  return found === '' ? null : Number(found);
}

function notify(factory: string, text: string, digest: boolean): void {
  execFileSync('uv', ['run', '--frozen', '--project', factory, 'factory', 'notify', FACTORY_APP, text, ...(digest ? ['--digest'] : [])], { stdio: 'inherit' });
}

async function commandPlan(): Promise<void> {
  const today = madridDay(new Date());
  const issueDate = issueDateFor(today);
  const paths = statePaths(issueDate);
  const collectedOn = existsSync(paths.candidates) ? madridDay(new Date(readCandidates(paths.candidates).collectedAt)).date : null;
  const result = plan({
    today,
    issueLive: await issueLive(issueDate),
    candidatesCollectedOn: collectedOn,
    pullOpen: openPull(issueDate) !== null,
    missedAlerted: existsSync(paths.missedAlert),
    publishedIssues: readIssues().length,
    reportSent: existsSync(REPORT_MARKER),
  });
  console.log(JSON.stringify({ ...result, today, paths, reportMarker: REPORT_MARKER }, null, 2));
}

async function collect(source: FeedSource, since: Date): Promise<Candidate[]> {
  const entries = parseFeed(await fetchText(source.feedUrl));
  return entries
    .filter((entry) => new Date(entry.published) >= since)
    .map((entry) => ({ ...entry, sourceName: source.name, section: source.section }));
}

async function commandFind(args: readonly string[]): Promise<void> {
  const issueDate = argument(args, 'date');
  const since = madridMidnight(addDays(issueDate, -ITEM_WINDOW_DAYS));
  const candidates: Candidate[] = [];
  const failures: FeedFailure[] = [];
  for (const source of SUNDAY_SOURCES) {
    try {
      candidates.push(...(await collect(source, since)));
    } catch (error) {
      failures.push({ sourceName: source.name, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  if (candidates.length === 0) throw new Error(`no stories collected; failures: ${JSON.stringify(failures)}`);
  const unique = [...new Map(candidates.map((candidate) => [candidate.link, candidate])).values()];
  const file: CandidateFile = { issueDate, collectedAt: new Date().toISOString(), since: since.toISOString(), candidates: unique, failures };
  writeJson(statePaths(issueDate).candidates, file);
  console.log(`${unique.length} stories since ${file.since} from ${SUNDAY_SOURCES.length - failures.length} of ${SUNDAY_SOURCES.length} feeds -> ${statePaths(issueDate).candidates}`);
  for (const failure of failures) console.log(`feed failed: ${failure.sourceName}: ${failure.reason}`);
}

function changedFiles(): readonly string[] {
  execFileSync('git', ['fetch', '-q', 'origin', 'main']);
  const tracked = execFileSync('git', ['diff', '--name-only', 'origin/main'], { encoding: 'utf8' });
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' });
  return `${tracked}\n${untracked}`.split('\n').map((line) => line.trim()).filter((line) => line !== '');
}

function validated(issueDate: string): SundayIssue {
  const paths = statePaths(issueDate);
  const issues = readIssues();
  const issue = issues.find((candidate) => candidate.slug === issueDate);
  if (issue === undefined) throw new Error(`no issue file ${paths.issueFile}`);
  const problems = [...issueProblems(issue, {
    earlierIssues: issues.filter((earlier) => earlier.slug !== issueDate),
    candidates: readCandidates(paths.candidates),
    mediaExists: (sitePath) => existsSync(join(PUBLIC_DIR, sitePath)),
  })];
  const others = changedFiles().filter((file) => file !== paths.issueFile);
  if (others.length > 0) problems.push(`only ${paths.issueFile} may change; also changed: ${others.join(', ')}`);
  if (problems.length > 0) throw new Error(`issue ${issueDate} breaks the rules:\n- ${problems.join('\n- ')}`);
  return issue;
}

function commandValidate(args: readonly string[]): void {
  const issue = validated(argument(args, 'date'));
  console.log(`issue ${issue.number} (${issue.slug}) follows the rules`);
}

async function commandApplyCheck(args: readonly string[]): Promise<void> {
  const issueDate = argument(args, 'date');
  const paths = statePaths(issueDate);
  const issue = validated(issueDate);
  const verdicts = parseVerdicts(readFileSync(paths.verdicts, 'utf8'));
  const unreachable: ItemVerdict[] = [];
  for (const section of issue.sections) {
    for (const item of section.items) {
      const status = await fetchStatus(item.sourceUrl);
      if (status !== 200) unreachable.push({ sourceUrl: item.sourceUrl, verdict: 'rejected', reason: `the link answered ${status}` });
    }
  }
  const combined = { issueDate, verdicts: [...unreachable, ...verdicts.verdicts.filter((verdict) => !unreachable.some((dead) => dead.sourceUrl === verdict.sourceUrl))] };
  const checked = applyVerdicts(issue, combined);
  writeJson(paths.issueFile, checked.issue);
  validated(issueDate);
  for (const rejected of checked.rejected) console.log(`rejected ${rejected.sourceUrl}: ${rejected.reason}`);
  const kept = checked.issue.sections.reduce((sum, section) => sum + section.items.length, 0);
  console.log(`${kept} items confirmed and kept in ${paths.issueFile}`);
}

async function waitFor(label: string, timeoutMs: number, probe: () => Promise<boolean>): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!(await probe())) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

async function deploySucceeded(sha: string): Promise<boolean> {
  const runs = gh(['run', 'list', '--repo', SITE_REPO, '--workflow', 'deploy.yml', '--commit', sha, '--json', 'status,conclusion', '--jq', '.[0] | "\\(.status) \\(.conclusion)"']);
  if (runs.startsWith('completed') && !runs.endsWith('success')) throw new Error(`the site deploy for ${sha} ended ${runs}`);
  return runs === 'completed success';
}

async function commandPublish(args: readonly string[]): Promise<void> {
  const issueDate = argument(args, 'date');
  const factory = argument(args, 'factory');
  const number = openPull(issueDate);
  if (number === null) throw new Error(`no open pull request for sunday/${issueDate}`);
  gh(['pr', 'merge', String(number), '--repo', SITE_REPO, '--merge', '--delete-branch']);
  const sha = gh(['pr', 'view', String(number), '--repo', SITE_REPO, '--json', 'mergeCommit', '--jq', '.mergeCommit.oid']);
  await waitFor('the site deploy', DEPLOY_TIMEOUT_MS, () => deploySucceeded(sha));
  await waitFor(issueUrl(issueDate), LIVE_TIMEOUT_MS, () => issueLive(issueDate));
  await waitFor('the sitemap', LIVE_TIMEOUT_MS, async () => (await fetchText(bust(`${SITE_ORIGIN}/sitemap.xml`))).includes(`<loc>${issueUrl(issueDate)}</loc>`));
  const issue = parseIssue(readFileSync(statePaths(issueDate).issueFile, 'utf8'), issueDate);
  const items = issue.sections.reduce((sum, section) => sum + section.items.length, 0);
  writeJson(statePaths(issueDate).published, { issueDate, number: issue.number, pull: number, sha, publishedAt: new Date().toISOString() });
  notify(factory, `<b>The Sunday post, issue ${issue.number}, is live</b> with ${items} stories: <a href="${issueUrl(issueDate)}">${issue.date}</a>.`, true);
}

function commandAlertMissed(args: readonly string[]): void {
  const issueDate = argument(args, 'date');
  const factory = argument(args, 'factory');
  const paths = statePaths(issueDate);
  if (existsSync(paths.missedAlert)) return;
  notify(factory, `<b>No Sunday post went live on ${issueDate}.</b> The weekly run didn't publish it. Nothing needed from you; next Sunday's issue runs as usual.`, false);
  writeJson(paths.missedAlert, { issueDate, alertedAt: new Date().toISOString() });
}

function commandMarkReported(): void {
  writeJson(REPORT_MARKER, { reportedAt: new Date().toISOString(), issues: readIssues().length });
}

const COMMANDS: Readonly<Record<string, (args: readonly string[]) => void | Promise<void>>> = {
  plan: commandPlan,
  find: commandFind,
  validate: commandValidate,
  'apply-check': commandApplyCheck,
  publish: commandPublish,
  'alert-missed': commandAlertMissed,
  'mark-reported': commandMarkReported,
};

const [name, ...rest] = process.argv.slice(2);
const command = name === undefined ? undefined : COMMANDS[name];
if (command === undefined) {
  console.error(`usage: node src/sunday/cli.ts <${Object.keys(COMMANDS).join('|')}> [--date yyyy-mm-dd] [--factory dir]`);
  process.exit(2);
}
await command(rest);
