import { existsSync } from 'node:fs';
import { madridDay } from './calendar.ts';
import { doneMessage, stepsStillDue } from './done.ts';
import { fetchMain, issueOnMain, issuesOnMain, openPull } from './github.ts';
import { issueDateFor, plan } from './plan.ts';
import { FACTORY_RUNTIME } from './sources.ts';
import { REPORT_MARKER, readCheckRecord, statePaths } from './state.ts';
import type { StatePaths } from './state.ts';
import type { IssueState, MadridDay, Plan } from './types.ts';

interface CurrentPlan {
  today: MadridDay;
  paths: StatePaths;
  result: Plan;
}

function issueState(issueDate: string): IssueState {
  if (issueOnMain(issueDate) !== null) return 'merged';
  return openPull(issueDate) === null ? 'none' : 'open-pr';
}

function checkerConfirmedNothing(issueDate: string, paths: StatePaths): boolean {
  if (!existsSync(paths.confirmedNothing)) return false;
  const record = readCheckRecord(paths.confirmedNothing);
  if (record.issueDate !== issueDate || record.verdicts.some((verdict) => verdict.verdict === 'confirmed')) {
    throw new Error(`${paths.confirmedNothing} does not record an empty check for ${issueDate}`);
  }
  return true;
}

function currentPlan(): CurrentPlan {
  const today = madridDay(new Date());
  const issueDate = issueDateFor(today);
  const paths = statePaths(issueDate);
  fetchMain();
  const result = plan({
    today,
    issueState: issueState(issueDate),
    candidatesCollected: existsSync(paths.candidates),
    checkerConfirmedNothing: checkerConfirmedNothing(issueDate, paths),
    publishedIssues: issuesOnMain().length,
    reportSent: existsSync(REPORT_MARKER),
  });
  return { today, paths, result };
}

export async function commandPlan(): Promise<void> {
  const { today, paths, result } = currentPlan();
  console.log(JSON.stringify({ ...result, today, paths, reportMarker: REPORT_MARKER, factoryRuntime: FACTORY_RUNTIME }, null, 2));
}

export async function commandDone(): Promise<void> {
  const { paths, result } = currentPlan();
  const due = stepsStillDue(result, { checked: existsSync(paths.check) });
  const message = doneMessage(result.issueDate, due);
  if (due.length === 0) {
    console.log(message);
    return;
  }
  console.error(message);
  process.exitCode = 1;
}
