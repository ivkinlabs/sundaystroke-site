import { sundayBefore, sundayOnOrAfter } from './calendar.ts';
import { PILOT_ISSUES, PUBLISH_HOUR } from './sources.ts';
import type { MadridDay, Plan, PlanFacts, Step } from './types.ts';

const FRIDAY: number = 5;
const SATURDAY: number = 6;
const SUNDAY: number = 0;

function inIssueWeekend(today: MadridDay): boolean {
  return today.weekday === FRIDAY || today.weekday === SATURDAY || today.weekday === SUNDAY;
}

export function issueDateFor(today: MadridDay): string {
  return inIssueWeekend(today) ? sundayOnOrAfter(today.date) : sundayBefore(today.date);
}

function weekendSteps(facts: PlanFacts): Step[] {
  const { weekday, hour, date } = facts.today;
  if (facts.issueLive) return [];
  const steps: Step[] = [];
  if (!facts.pullOpen && facts.candidatesCollectedOn !== date) steps.push('find');
  if (!facts.pullOpen && weekday !== FRIDAY) steps.push('write', 'check', 'open-pr');
  if (weekday === SUNDAY && hour >= PUBLISH_HOUR) steps.push('publish');
  return steps;
}

export function plan(facts: PlanFacts): Plan {
  const issueDate = issueDateFor(facts.today);
  const steps: Step[] = inIssueWeekend(facts.today) ? weekendSteps(facts) : [];
  if (!inIssueWeekend(facts.today) && !facts.issueLive && !facts.missedAlerted) steps.push('alert-missed');
  if (facts.publishedIssues >= PILOT_ISSUES && !facts.reportSent) steps.push('report');
  return { issueDate, steps };
}
