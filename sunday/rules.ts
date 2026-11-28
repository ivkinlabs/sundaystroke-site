import { addDays, displaySunday, isSunday, madridDay, madridMidnight } from './calendar.ts';
import { copiedRun, wordCount } from './originality.ts';
import { promotionReasons } from './promotion.ts';
import { BODY_WORDS, COPY_RULES, DISC_GOLF_WORDS, ITEM_WINDOW_DAYS, MAX_ITEMS, NOTE_WORDS, WHY_WORDS } from './sources.ts';
import type { WordRange } from './sources.ts';
import type { Candidate, CandidateFile } from './types.ts';
import { hasExactKeys, isRecord } from '../src/lib/guards.ts';
import { SUNDAY_SECTION_HEADINGS } from '../src/lib/sundayIssue.ts';
import type { SundayIssue, SundayItem, SundaySection } from '../src/types/sunday.ts';

export interface RuleContext {
  earlierIssues: readonly SundayIssue[];
  candidates: CandidateFile;
}

const ABBREVIATIONS: RegExp = /\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|No|U\.S|U\.K|a\.m|p\.m|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|[A-Z])\./g;
const SENTENCE_END: RegExp = /[.!?…]+["”’)]*(?=\s|$)/g;
const SUMMARY_CHARS: number = 160;
const TITLE_SUFFIX: string = ' | SundayStroke';
const SECTION_ORDER: readonly string[] = Object.keys(SUNDAY_SECTION_HEADINGS);
const ISSUE_FIELDS: readonly string[] = ['slug', 'number', 'date', 'title', 'pageTitle', 'summary', 'editorNote', 'sections'];
const SECTION_FIELDS: readonly string[] = ['key', 'items'];
const ITEM_FIELDS: readonly string[] = ['headline', 'body', 'whyItMatters', 'sourceLabel', 'sourceUrl', 'published'];
const DISC_GOLF_SECTION: string = SUNDAY_SECTION_HEADINGS.tracer;

export function sentenceCount(text: string): number {
  return (text.replace(ABBREVIATIONS, 'ABBR').trim().match(SENTENCE_END) ?? []).length;
}

function itemText(item: SundayItem): string {
  return [item.headline, item.body, item.whyItMatters ?? ''].join(' ');
}

function sectionText(section: SundaySection): string {
  return section.items.map(itemText).join(' ');
}

function wordProblem(text: string, range: WordRange, label: string): string[] {
  const words = wordCount(text);
  return words < range.min || words > range.max ? [`${label} has ${words} words; ${range.min} to ${range.max} allowed`] : [];
}

function headerProblems(issue: SundayIssue, context: RuleContext): string[] {
  const problems: string[] = [];
  const expectedNumber = Math.max(0, ...context.earlierIssues.map((earlier) => earlier.number)) + 1;
  if (!isSunday(issue.slug)) problems.push(`slug ${issue.slug} is not a Sunday`);
  else if (issue.date !== displaySunday(issue.slug)) problems.push(`date must read "${displaySunday(issue.slug)}"`);
  if (issue.slug !== context.candidates.issueDate) problems.push(`the candidates are for ${context.candidates.issueDate}, not ${issue.slug}`);
  if (context.earlierIssues.some((earlier) => earlier.slug === issue.slug)) problems.push(`an issue for ${issue.slug} already exists`);
  if (issue.number !== expectedNumber) problems.push(`number must be ${expectedNumber}`);
  if (issue.title !== `The Sunday post, issue ${expectedNumber}`) problems.push(`title must be "The Sunday post, issue ${expectedNumber}"`);
  if (!issue.pageTitle.endsWith(TITLE_SUFFIX)) problems.push(`pageTitle must end with "${TITLE_SUFFIX}"`);
  if (issue.summary.trim() === '' || issue.summary.length > SUMMARY_CHARS) problems.push(`summary must be 1–${SUMMARY_CHARS} characters`);
  if (issue.editorNote === null) problems.push("the issue has no editor's note");
  else problems.push(...wordProblem(issue.editorNote, NOTE_WORDS, "the editor's note"));
  const outsideDiscGolf = [issue.title, issue.pageTitle, issue.summary, issue.editorNote ?? ''];
  if (outsideDiscGolf.some((text) => DISC_GOLF_WORDS.test(text))) problems.push(`disc golf is named outside the ${DISC_GOLF_SECTION} section`);
  return problems;
}

interface ItemWindow {
  from: Date;
  to: Date;
}

function itemWindow(issueDate: string): ItemWindow {
  return { from: madridMidnight(addDays(issueDate, -ITEM_WINDOW_DAYS)), to: madridMidnight(addDays(issueDate, 1)) };
}

function itemProblems(section: SundaySection, byUrl: ReadonlyMap<string, Candidate>, seen: Set<string>, window: ItemWindow): string[] {
  const problems: string[] = [];
  if (section.items.length === 0) problems.push(`the ${section.key} section is empty; drop it`);
  if (section.key === 'golf' && DISC_GOLF_WORDS.test(sectionText(section))) problems.push('disc golf is named in the Golf section');
  for (const item of section.items) {
    const label = `"${item.headline}"`;
    if (item.headline.trim() === '') problems.push('an item has no headline');
    problems.push(...wordProblem(item.body, BODY_WORDS, label));
    if (item.whyItMatters === null) problems.push(`${label} has no line on why it matters`);
    else {
      const sentences = sentenceCount(item.whyItMatters);
      if (sentences !== 1) problems.push(`${label} says why it matters in ${sentences} sentences; one allowed`);
      problems.push(...wordProblem(item.whyItMatters, WHY_WORDS, `${label}'s line on why it matters`));
    }
    if (seen.has(item.sourceUrl)) problems.push(`${label} repeats a source`);
    seen.add(item.sourceUrl);
    const candidate = byUrl.get(item.sourceUrl);
    if (candidate === undefined) {
      problems.push(`${label} links ${item.sourceUrl}, which is not one of this week's collected stories`);
      continue;
    }
    if (candidate.section !== section.key) problems.push(`${label} comes from ${candidate.sourceName}, which belongs in the ${candidate.section} section`);
    if (item.sourceLabel !== candidate.sourceName) problems.push(`${label} must credit "${candidate.sourceName}"`);
    const published = new Date(candidate.published);
    if (!(published >= window.from && published < window.to)) problems.push(`${label} was published ${candidate.published}, outside the ${ITEM_WINDOW_DAYS} days before the issue`);
    const day = madridDay(published).date;
    if (item.published !== day) problems.push(`${label} must carry its source's date, ${day}`);
    const sourceText = [candidate.title, candidate.excerpt].join(' ');
    const copied = copiedRun(itemText(item), sourceText);
    if (copied !== null) problems.push(`${label} copies its source word for word: "${copied}"`);
  }
  return problems;
}

function copyProblems(issue: SundayIssue): string[] {
  const texts = [issue.title, issue.pageTitle, issue.summary, issue.editorNote ?? '', ...issue.sections.map(sectionText)];
  const broken = COPY_RULES.filter((rule) => texts.some((text) => rule.pattern.test(text))).map((rule) => rule.reason);
  const promoting = [...new Set(texts.flatMap(promotionReasons))];
  return [...broken, ...promoting].map((reason) => `the copy ${reason}`);
}

function fieldProblem(value: unknown, fields: readonly string[], label: string): string[] {
  if (isRecord(value) && hasExactKeys(value, fields)) return [];
  return [`${label} must have exactly the fields ${fields.join(', ')}`];
}

export function shapeProblems(value: unknown): readonly string[] {
  const problems = fieldProblem(value, ISSUE_FIELDS, 'the issue');
  const sections = isRecord(value) && Array.isArray(value.sections) ? value.sections : [];
  for (const section of sections) {
    problems.push(...fieldProblem(section, SECTION_FIELDS, 'each section'));
    const items = isRecord(section) && Array.isArray(section.items) ? section.items : [];
    for (const item of items) problems.push(...fieldProblem(item, ITEM_FIELDS, 'each item'));
  }
  return [...new Set(problems)];
}

export function issueFileProblems(json: unknown, issue: SundayIssue, context: RuleContext): readonly string[] {
  return [...shapeProblems(json), ...issueProblems(issue, context)];
}

export function issueProblems(issue: SundayIssue, context: RuleContext): readonly string[] {
  const problems = [...headerProblems(issue, context), ...copyProblems(issue)];
  const keys = issue.sections.map((section) => section.key);
  const ordered = SECTION_ORDER.filter((key) => keys.some((present) => present === key));
  if (new Set(keys).size !== keys.length || keys.join() !== ordered.join()) problems.push(`sections must be Golf, then ${DISC_GOLF_SECTION}, each at most once`);
  const total = issue.sections.reduce((sum, section) => sum + section.items.length, 0);
  if (total < 1 || total > MAX_ITEMS) problems.push(`${total} items; 1 to ${MAX_ITEMS} allowed`);
  const byUrl = new Map(context.candidates.candidates.map((candidate) => [candidate.link, candidate]));
  const seen = new Set<string>();
  const window = isSunday(issue.slug) ? itemWindow(issue.slug) : { from: new Date(0), to: new Date(0) };
  for (const section of issue.sections) problems.push(...itemProblems(section, byUrl, seen, window));
  return problems;
}
