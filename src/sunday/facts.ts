import { existsSync } from 'node:fs';
import { madridDay } from './calendar.ts';
import { fetchMain, issueOnMain, issuesOnMain, openPull } from './github.ts';
import { issueDateFor, plan } from './plan.ts';
import { issueLive } from './site.ts';
import { FACTORY_RUNTIME } from './sources.ts';
import { REPORT_MARKER, statePaths } from './state.ts';
import type { IssueState } from './types.ts';

async function issueState(issueDate: string): Promise<IssueState> {
  if (await issueLive(issueDate)) return 'live';
  if (issueOnMain(issueDate) !== null) return 'merged';
  return openPull(issueDate) === null ? 'none' : 'open-pr';
}

export async function commandPlan(): Promise<void> {
  const today = madridDay(new Date());
  const issueDate = issueDateFor(today);
  const paths = statePaths(issueDate);
  fetchMain();
  const result = plan({
    today,
    issueState: await issueState(issueDate),
    candidatesCollected: existsSync(paths.candidates),
    announced: existsSync(paths.announced),
    missedAlerted: existsSync(paths.missedAlert),
    publishedIssues: issuesOnMain().length,
    reportSent: existsSync(REPORT_MARKER),
  });
  console.log(JSON.stringify({ ...result, today, paths, reportMarker: REPORT_MARKER, factoryRuntime: FACTORY_RUNTIME }, null, 2));
}
