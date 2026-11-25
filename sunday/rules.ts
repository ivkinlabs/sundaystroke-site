import { addDays, displaySunday, isSunday, madridDay, madridMidnight } from './calendar.ts';
import {
  BODY_WORDS,
  COPIED_RUN_WORDS,
  COPY_RULES,
  DISC_GOLF_WORDS,
  HEADLINE_MAX_WORDS,
  ITEM_WINDOW_DAYS,
  MAX_ITEMS,
  NOTE_WORDS,
  PREVIEW_DESCRIPTION_CHARS,
  WHY_MAX_WORDS,
} from './sources.ts';
import { isSafeImageUrl } from './preview.ts';
import { longestSharedRun, sentenceCount, wordCount } from './text.ts';
import type { Candidate, CandidateFile, WordRange } from './types.ts';
import { SECTION_ORDER } from '../src/lib/sundaySections.ts';
import type { CurrentIssue, SourcePreview, SundayIssueHeader, SundaySection, SundayStory } from '../src/types/sunday.ts';

export interface RuleContext {
  earlierIssues: readonly SundayIssueHeader[];
  candidates: CandidateFile;
}

interface ItemWindow {
  from: Date;
  to: Date;
}

const SUMMARY_CHARS: number = 160;
const TITLE_SUFFIX: string = ' | SundayStroke';

function outsideRange(label: string, text: string, range: WordRange): string[] {
  const words = wordCount(text);
  return words < range.min || words > range.max ? [`${label} has ${words} words; ${range.min} to ${range.max} allowed`] : [];
}

function copiedFrom(label: string, ours: readonly string[], sources: readonly string[]): string[] {
  const copied = ours.some((text) => sources.some((source) => longestSharedRun(text, source) >= COPIED_RUN_WORDS));
  return copied ? [`${label} repeats ${COPIED_RUN_WORDS} or more words in a row from its source; write it in our own words`] : [];
}

function sourceTexts(candidate: Candidate, preview: SourcePreview | null): readonly string[] {
  return [candidate.title, candidate.excerpt, ...(preview === null ? [] : [preview.title, preview.description])];
}

function headerProblems(issue: CurrentIssue, context: RuleContext): string[] {
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
  problems.push(...outsideRange("the editor's note", issue.editorsNote, NOTE_WORDS));
  return problems;
}

function itemWindow(issueDate: string): ItemWindow {
  return { from: madridMidnight(addDays(issueDate, -ITEM_WINDOW_DAYS)), to: madridMidnight(addDays(issueDate, 1)) };
}

function previewProblems(label: string, preview: SourcePreview | null): string[] {
  if (preview === null) return [`${label} has no source preview; run the preview command`];
  const problems: string[] = [];
  if (preview.title.trim() === '' || preview.siteName.trim() === '') problems.push(`${label}'s preview needs a title and a site name`);
  if (preview.description.length > PREVIEW_DESCRIPTION_CHARS) problems.push(`${label}'s preview description is over ${PREVIEW_DESCRIPTION_CHARS} characters`);
  if (preview.image !== null && !isSafeImageUrl(preview.image)) problems.push(`${label}'s preview image must be an https address`);
  return problems;
}

function storyProblems(story: SundayStory, candidate: Candidate, section: SundaySection, window: ItemWindow): string[] {
  const label = `"${story.headline}"`;
  const problems: string[] = [];
  if (story.headline.trim() === '') problems.push('an item has no headline');
  if (wordCount(story.headline) > HEADLINE_MAX_WORDS) problems.push(`${label} is longer than ${HEADLINE_MAX_WORDS} words`);
  problems.push(...outsideRange(label, story.body, BODY_WORDS));
  if (sentenceCount(story.whyItMatters) !== 1 || wordCount(story.whyItMatters) > WHY_MAX_WORDS) {
    problems.push(`${label} needs one line, at most ${WHY_MAX_WORDS} words, on why it matters`);
  }
  if (candidate.section !== section.key) problems.push(`${label} comes from ${candidate.sourceName}, which belongs in the ${candidate.section} section`);
  if (story.sourceLabel !== candidate.sourceName) problems.push(`${label} must credit "${candidate.sourceName}"`);
  const published = new Date(candidate.published);
  if (Number.isNaN(published.getTime())) problems.push(`${label}'s source has an unreadable date: ${candidate.published}`);
  else if (!(published >= window.from && published < window.to)) problems.push(`${label} was published ${candidate.published}, outside the ${ITEM_WINDOW_DAYS} days before the issue`);
  else if (story.published !== madridDay(published).date) problems.push(`${label} must be dated ${madridDay(published).date}`);
  problems.push(...previewProblems(label, story.preview));
  problems.push(...copiedFrom(label, [story.headline, story.body, story.whyItMatters], sourceTexts(candidate, story.preview)));
  return problems;
}

function sectionProblems(section: SundaySection, byUrl: ReadonlyMap<string, Candidate>, seen: Set<string>, window: ItemWindow): string[] {
  const problems: string[] = [];
  if (section.items.length === 0) problems.push(`the ${section.key} section is empty; drop it`);
  const golfText = section.items.flatMap((story) => [story.headline, story.body, story.whyItMatters]).join(' ');
  if (section.key === 'golf' && DISC_GOLF_WORDS.test(golfText)) problems.push('disc golf is named in the Golf section');
  for (const story of section.items) {
    if (seen.has(story.sourceUrl)) problems.push(`"${story.headline}" repeats a source`);
    seen.add(story.sourceUrl);
    const candidate = byUrl.get(story.sourceUrl);
    if (candidate === undefined) problems.push(`"${story.headline}" links ${story.sourceUrl}, which is not one of this week's collected stories`);
    else problems.push(...storyProblems(story, candidate, section, window));
  }
  return problems;
}

function copyProblems(issue: CurrentIssue): string[] {
  const stories = issue.sections.flatMap((section) => section.items.flatMap((story) => [story.headline, story.body, story.whyItMatters]));
  const texts = [issue.title, issue.pageTitle, issue.summary, issue.editorsNote, ...stories];
  return COPY_RULES.flatMap((rule) => {
    const hit = texts.map((text) => rule.pattern.exec(text)?.[0]).find((match) => match !== undefined);
    return hit === undefined ? [] : [`the copy ${rule.reason} ("${hit}")`];
  });
}

function noteCopied(issue: CurrentIssue, byUrl: ReadonlyMap<string, Candidate>): string[] {
  const sources = issue.sections.flatMap((section) =>
    section.items.flatMap((story) => {
      const candidate = byUrl.get(story.sourceUrl);
      return candidate === undefined ? [] : sourceTexts(candidate, story.preview);
    }),
  );
  return copiedFrom("the editor's note", [issue.editorsNote, issue.summary], sources);
}

export function issueProblems(issue: CurrentIssue, context: RuleContext): readonly string[] {
  const problems = [...headerProblems(issue, context), ...copyProblems(issue)];
  const keys = issue.sections.map((section) => section.key);
  const ordered = SECTION_ORDER.filter((key) => keys.some((present) => present === key));
  if (new Set(keys).size !== keys.length || keys.join() !== ordered.join()) problems.push('sections must be Golf, then Disc golf, each at most once');
  const total = issue.sections.reduce((sum, section) => sum + section.items.length, 0);
  if (total < 1 || total > MAX_ITEMS) problems.push(`${total} items; 1 to ${MAX_ITEMS} allowed`);
  const byUrl = new Map(context.candidates.candidates.map((candidate) => [candidate.link, candidate]));
  const seen = new Set<string>();
  if (!isSunday(issue.slug)) return problems;
  const window = itemWindow(issue.slug);
  for (const section of issue.sections) problems.push(...sectionProblems(section, byUrl, seen, window));
  problems.push(...noteCopied(issue, byUrl));
  return problems;
}
