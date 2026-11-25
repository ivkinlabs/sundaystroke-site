import type { IssueProgress, Plan, Step } from './types.ts';

export function stepsStillDue(result: Plan, progress: IssueProgress): readonly Step[] {
  if (!progress.checked) return result.steps;
  return result.steps.filter((step) => step !== 'write' && step !== 'check');
}

export function doneMessage(issueDate: string, due: readonly Step[]): string {
  if (due.length === 0) return `the Sunday post for ${issueDate} has nothing due`;
  return `the Sunday post for ${issueDate} stopped before it finished; still due: ${due.join(', ')}`;
}
