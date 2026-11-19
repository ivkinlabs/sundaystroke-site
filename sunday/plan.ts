import { sundayBefore, sundayOnOrAfter } from './calendar.ts';
import { FIRST_AUTOMATED_ISSUE, PILOT_ISSUES } from './sources.ts';
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

function issueSteps(facts: PlanFacts): Step[] {
  if (facts.issueState !== 'none' || !inIssueWeekend(facts.today)) return [];
  const steps: Step[] = facts.candidatesCollected ? [] : ['find'];
  if (facts.today.weekday === FRIDAY) return steps;
  return [...steps, 'write', 'check', 'open-pr'];
}

export function plan(facts: PlanFacts): Plan {
  const issueDate = issueDateFor(facts.today);
  const steps: Step[] = issueDate >= FIRST_AUTOMATED_ISSUE ? issueSteps(facts) : [];
  if (facts.publishedIssues >= PILOT_ISSUES && !facts.reportSent) steps.push('report');
  return { issueDate, steps };
}
