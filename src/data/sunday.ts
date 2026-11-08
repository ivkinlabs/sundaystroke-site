import { parseIssue, sortedIssues } from '../lib/sundayIssue.ts';
import type { SundayIssue } from '../types/sunday.ts';

const ISSUE_FILES: Readonly<Record<string, string>> = import.meta.glob<string>('./sunday/*.json', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export const SUNDAY_ISSUES: readonly SundayIssue[] = sortedIssues(
  Object.entries(ISSUE_FILES).map(([path, json]) => parseIssue(json, path)),
);
