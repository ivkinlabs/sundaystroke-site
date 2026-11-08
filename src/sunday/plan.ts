import { sundayBefore, sundayOnOrAfter } from './calendar.ts';
import { FIRST_AUTOMATED_ISSUE, PILOT_ISSUES, PUBLISH_HOUR } from './sources.ts';
import type { MadridDay, Plan, PlanFacts, Step } from './types.ts';

const FRIDAY: number = 5;
const SATURDAY: number = 6;
const SUNDAY: number = 0;

function inIssueWeekend(today: MadridDay): boolean {
  return today.weekday === FRIDAY || today.weekday === SATURDAY || today.weekday === SUNDAY;
}

function publishTimeReached(today: MadridDay): boolean {
  return today.weekday !== SUNDAY || today.hour >= PUBLISH_HOUR;
}

export function issueDateFor(today: MadridDay): string {
  return inIssueWeekend(today) ? sundayOnOrAfter(today.date) : sundayBefore(today.date);
}

function issueSteps(facts: PlanFacts): Step[] {
  const { today } = facts;
  switch (facts.issueState) {
    case 'live':
    case 'merged':
      return facts.announced ? [] : ['publish'];
    case 'open-pr':
      return today.weekday !== FRIDAY && today.weekday !== SATURDAY && publishTimeReached(today) ? ['publish'] : [];
    case 'none': {
      if (!inIssueWeekend(today)) return facts.missedAlerted ? [] : ['alert-missed'];
      const steps: Step[] = facts.candidatesCollected ? [] : ['find'];
      if (today.weekday === FRIDAY) return steps;
      steps.push('write', 'check', 'open-pr');
      if (today.weekday === SUNDAY && publishTimeReached(today)) steps.push('publish');
      return steps;
    }
    default: {
      const unhandled: never = facts.issueState;
      throw new Error(`Unhandled issue state: ${String(unhandled)}`);
    }
  }
}

export function plan(facts: PlanFacts): Plan {
  const issueDate = issueDateFor(facts.today);
  const steps: Step[] = issueDate >= FIRST_AUTOMATED_ISSUE ? issueSteps(facts) : [];
  if (facts.publishedIssues >= PILOT_ISSUES && !facts.reportSent) steps.push('report');
  return { issueDate, steps };
}
