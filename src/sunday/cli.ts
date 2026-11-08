import { issueDateArgument } from './calendar.ts';
import { commandFind } from './collect.ts';
import { commandPlan } from './facts.ts';
import { issuesOnMain, fetchMain } from './github.ts';
import { commandCheck, commandOpenPull, commandValidate } from './issueCheck.ts';
import { commandAlertMissed, commandPublish } from './publish.ts';
import { REPORT_MARKER, withLock, writeJson } from './state.ts';

type Command = (args: readonly string[]) => void | Promise<void>;

function dateArgument(args: readonly string[]): string {
  const at = args.indexOf('--date');
  const value = at >= 0 ? args[at + 1] : undefined;
  if (value === undefined) throw new Error('--date yyyy-mm-dd is required');
  return issueDateArgument(value);
}

function locked(work: (issueDate: string) => void | Promise<void>): Command {
  return (args) => withLock(async () => work(dateArgument(args)));
}

function markReported(): void {
  fetchMain();
  writeJson(REPORT_MARKER, { reportedAt: new Date().toISOString(), issues: issuesOnMain().length });
}

const COMMANDS: Readonly<Record<string, Command>> = {
  plan: commandPlan,
  find: locked(commandFind),
  validate: (args) => commandValidate(dateArgument(args)),
  check: locked(commandCheck),
  'open-pr': locked(commandOpenPull),
  publish: locked(commandPublish),
  'alert-missed': locked(commandAlertMissed),
  'mark-reported': () => withLock(async () => markReported()),
};

const [name, ...rest] = process.argv.slice(2);
const command = name === undefined ? undefined : COMMANDS[name];
if (command === undefined) {
  console.error(`usage: node src/sunday/cli.ts <${Object.keys(COMMANDS).join('|')}> [--date yyyy-mm-dd]`);
  process.exit(2);
}
await command(rest);
