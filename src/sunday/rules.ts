import { addDays, displaySunday, isSunday, madridMidnight } from './calendar.ts';
import { COPY_RULES, DISC_GOLF_WORDS, ITEM_WINDOW_DAYS, MAX_ITEMS, SECTION_HEADINGS } from './sources.ts';
import type { Candidate, CandidateFile } from './types.ts';
import type { SundayIssue, SundaySection } from '../types/sunday.ts';

export interface RuleContext {
  earlierIssues: readonly SundayIssue[];
  candidates: CandidateFile;
  mediaExists: (sitePath: string) => boolean;
}

const ABBREVIATIONS: RegExp = /\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|No|U\.S|U\.K|a\.m|p\.m|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|[A-Z])\./g;
const SITE_MEDIA: RegExp = /^\/media\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*\.(?:mp4|jpg)$/;
const SENTENCE_END: RegExp = /[.!?…]+["”’)]*(?=\s|$)/g;
const SUMMARY_CHARS: number = 160;
const TITLE_SUFFIX: string = ' | SundayStroke';
const SECTION_ORDER: readonly string[] = ['golf', 'tracer'];

export function sentenceCount(text: string): number {
  return (text.replace(ABBREVIATIONS, 'ABBR').trim().match(SENTENCE_END) ?? []).length;
}

function sectionText(section: SundaySection): string {
  return [section.heading, ...section.items.flatMap((item) => [item.headline, item.body])].join(' ');
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
  if (issue.leadText.trim() === '') problems.push('the lead has no text');
  if (issue.leadClips.length === 0) problems.push('the lead has no clip of ours');
  for (const clip of issue.leadClips) {
    if (!clip.src.endsWith('.mp4') || !clip.poster.endsWith('.jpg')) problems.push(`lead clip ${clip.src} needs an .mp4 and a .jpg poster`);
    for (const path of [clip.src, clip.poster]) {
      if (!SITE_MEDIA.test(path) || !context.mediaExists(path)) problems.push(`lead media ${path} is not one of the site's own files`);
    }
  }
  const outsideTracer = [issue.title, issue.pageTitle, issue.summary, issue.leadText, ...issue.leadClips.map((clip) => clip.label)];
  if (outsideTracer.some((text) => DISC_GOLF_WORDS.test(text))) problems.push('disc golf is named outside the Tracer section');
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
  if (section.heading !== SECTION_HEADINGS[section.key]) problems.push(`the ${section.key} heading must be "${SECTION_HEADINGS[section.key]}"`);
  if (section.items.length === 0) problems.push(`the ${section.key} section is empty; drop it`);
  if (section.key === 'golf' && DISC_GOLF_WORDS.test(sectionText(section))) problems.push('disc golf is named in the Golf section');
  for (const item of section.items) {
    const label = `"${item.headline}"`;
    if (item.headline.trim() === '') problems.push('an item has no headline');
    const sentences = sentenceCount(item.body);
    if (sentences < 1 || sentences > 2) problems.push(`${label} has ${sentences} sentences; one or two allowed`);
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
  }
  return problems;
}

function copyProblems(issue: SundayIssue): string[] {
  const texts = [issue.title, issue.pageTitle, issue.summary, issue.leadText, ...issue.leadClips.map((clip) => clip.label), ...issue.sections.map(sectionText)];
  return COPY_RULES.filter((rule) => texts.some((text) => rule.pattern.test(text))).map((rule) => `the copy ${rule.reason}`);
}

export function issueProblems(issue: SundayIssue, context: RuleContext): readonly string[] {
  const problems = [...headerProblems(issue, context), ...copyProblems(issue)];
  const keys = issue.sections.map((section) => section.key);
  const ordered = SECTION_ORDER.filter((key) => keys.some((present) => present === key));
  if (new Set(keys).size !== keys.length || keys.join() !== ordered.join()) problems.push('sections must be Golf, then Tracer, each at most once');
  const total = issue.sections.reduce((sum, section) => sum + section.items.length, 0);
  if (total < 1 || total > MAX_ITEMS) problems.push(`${total} items; 1 to ${MAX_ITEMS} allowed`);
  const byUrl = new Map(context.candidates.candidates.map((candidate) => [candidate.link, candidate]));
  const seen = new Set<string>();
  const window = isSunday(issue.slug) ? itemWindow(issue.slug) : { from: new Date(0), to: new Date(0) };
  for (const section of issue.sections) problems.push(...itemProblems(section, byUrl, seen, window));
  return problems;
}
