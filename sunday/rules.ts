import { addDays, displaySunday, isIsoDay, isSunday, madridDay, madridMidnight } from './calendar.ts';
import { copiedRun, wordCount } from './originality.ts';
import { promotionReasons } from './promotion.ts';
import {
  BODY_WORDS,
  COPY_RULES,
  DISC_GOLF_WORDS,
  ITEM_WINDOW_DAYS,
  LEAD_WORDS,
  MAX_EVENTS,
  MAX_ITEMS,
  MAX_QUICK_HITS,
  MIN_QUICK_HITS,
  NOTE_WORDS,
  QUICK_HIT_WORDS,
  TIP_WORDS,
  WHY_WORDS,
  tourScheduleFor,
} from './sources.ts';
import type { WordRange } from './sources.ts';
import type { Candidate, CandidateFile } from './types.ts';
import { hasExactKeys, isRecord } from '../src/lib/guards.ts';
import { SUNDAY_SECTION_HEADINGS } from '../src/lib/sundayIssue.ts';
import type { SourceCredit, SundayEvent, SundayIssue, SundayItem, SundayPreview, SundayQuickHit, SundaySection, SundaySectionKey, SundayTip } from '../src/types/sunday.ts';

export interface RuleContext {
  earlierIssues: readonly SundayIssue[];
  candidates: CandidateFile;
}

interface ItemWindow {
  from: Date;
  to: Date;
}

interface Sources {
  byUrl: ReadonlyMap<string, Candidate>;
  seen: Set<string>;
  scheduleUrls: Set<string>;
  window: ItemWindow;
}

const ABBREVIATIONS: RegExp = /\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|No|U\.S|U\.K|a\.m|p\.m|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|[A-Z])\./g;
const SENTENCE_END: RegExp = /[.!?…]+["”’)]*(?=\s|$)/g;
const SUMMARY_CHARS: number = 160;
const TITLE_SUFFIX: string = ' | SundayStroke';
const SECTION_ORDER: readonly string[] = Object.keys(SUNDAY_SECTION_HEADINGS);
const ISSUE_FIELDS: readonly string[] = ['slug', 'number', 'date', 'title', 'pageTitle', 'summary', 'editorNote', 'lead', 'quickHits', 'thisWeek', 'sundayRound', 'sections'];
const SECTION_FIELDS: readonly string[] = ['key', 'items'];
const ITEM_FIELDS: readonly string[] = ['headline', 'body', 'whyItMatters', 'sourceLabel', 'sourceUrl', 'published', 'preview'];
const PREVIEW_FIELDS: readonly string[] = ['title', 'siteName', 'description', 'image'];
const QUICK_HIT_FIELDS: readonly string[] = ['text', 'sourceLabel', 'sourceUrl'];
const EVENT_FIELDS: readonly string[] = ['name', 'starts', 'ends', 'venue', 'whyWatch', 'sourceLabel', 'sourceUrl'];
const TIP_FIELDS: readonly string[] = ['kind', 'headline', 'body', 'sourceLabel', 'sourceUrl'];
const DISC_GOLF_SECTION: string = SUNDAY_SECTION_HEADINGS.tracer;

export function cleanHttps(value: string, base?: string): string | null {
  const url = value === '' ? null : URL.parse(value, base);
  return url?.protocol === 'https:' && url.username === '' && url.password === '' ? url.href : null;
}

export function previewShown(preview: SundayPreview): boolean {
  const text = [preview.title, preview.siteName, preview.description].join(' ');
  const clean = promotionReasons(text).length === 0 && !COPY_RULES.some((rule) => rule.pattern.test(text));
  return preview.title !== '' && clean && (preview.image === null || cleanHttps(preview.image) !== null);
}

export function sentenceCount(text: string): number {
  return (text.replace(ABBREVIATIONS, 'ABBR').trim().match(SENTENCE_END) ?? []).length;
}

function itemText(item: SundayItem): string {
  return [item.headline, item.body, item.whyItMatters ?? ''].join(' ');
}

function eventText(event: SundayEvent): string {
  return [event.name, event.venue, event.whyWatch].join(' ');
}

function tipText(tip: SundayTip): string {
  return [tip.headline, tip.body].join(' ');
}

function sectionText(section: SundaySection): string {
  return section.items.map(itemText).join(' ');
}

function outsideSectionsText(issue: SundayIssue): readonly string[] {
  return [
    issue.title,
    issue.pageTitle,
    issue.summary,
    issue.editorNote ?? '',
    issue.lead === null ? '' : itemText(issue.lead),
    ...issue.quickHits.map((hit) => hit.text),
    ...(issue.thisWeek ?? []).map(eventText),
    issue.sundayRound === null ? '' : tipText(issue.sundayRound),
  ];
}

function wordProblem(text: string, range: WordRange, label: string): string[] {
  const words = wordCount(text);
  return words < range.min || words > range.max ? [`${label} has ${words} words; ${range.min} to ${range.max} allowed`] : [];
}

function oneLineProblems(text: string, range: WordRange, label: string): string[] {
  const sentences = sentenceCount(text);
  const problems = sentences === 1 ? [] : [`${label} takes ${sentences} sentences; one allowed`];
  return [...problems, ...wordProblem(text, range, label)];
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
  if (outsideSectionsText(issue).some((text) => DISC_GOLF_WORDS.test(text))) problems.push(`disc golf is named outside the ${DISC_GOLF_SECTION} section`);
  return problems;
}

function itemWindow(issueDate: string): ItemWindow {
  return { from: madridMidnight(addDays(issueDate, -ITEM_WINDOW_DAYS)), to: madridMidnight(addDays(issueDate, 1)) };
}

function sourceProblems(label: string, link: SourceCredit, section: SundaySectionKey, sources: Sources): { problems: string[]; candidate: Candidate | null } {
  const problems: string[] = [];
  if (sources.seen.has(link.sourceUrl)) problems.push(`${label} repeats a source`);
  sources.seen.add(link.sourceUrl);
  const candidate = sources.byUrl.get(link.sourceUrl);
  if (candidate === undefined) {
    problems.push(`${label} links ${link.sourceUrl}, which is not one of this week's collected stories`);
    return { problems, candidate: null };
  }
  if (candidate.section !== section) problems.push(`${label} comes from ${candidate.sourceName}, which belongs in the ${candidate.section} section`);
  if (link.sourceLabel !== candidate.sourceName) problems.push(`${label} must credit "${candidate.sourceName}"`);
  const published = new Date(candidate.published);
  if (!(published >= sources.window.from && published < sources.window.to)) problems.push(`${label} was published ${candidate.published}, outside the ${ITEM_WINDOW_DAYS} days before the issue`);
  return { problems, candidate };
}

function copiedProblem(label: string, ours: string, source: readonly string[]): string[] {
  const copied = copiedRun(ours, source.join(' '));
  return copied === null ? [] : [`${label} copies its source word for word: "${copied}"`];
}

function storyProblems(item: SundayItem, section: SundaySectionKey, bodyWords: WordRange, sources: Sources, label: string = `"${item.headline}"`): string[] {
  const problems: string[] = [];
  if (item.headline.trim() === '') problems.push('an item has no headline');
  problems.push(...wordProblem(item.body, bodyWords, label));
  if (item.whyItMatters === null) problems.push(`${label} has no line on why it matters`);
  else {
    const sentences = sentenceCount(item.whyItMatters);
    if (sentences !== 1) problems.push(`${label} says why it matters in ${sentences} sentences; one allowed`);
    problems.push(...wordProblem(item.whyItMatters, WHY_WORDS, `${label}'s line on why it matters`));
  }
  if (item.preview !== null && !previewShown(item.preview)) problems.push(`${label} has a preview code would not fill`);
  const { problems: linked, candidate } = sourceProblems(label, item, section, sources);
  problems.push(...linked);
  if (candidate === null) return problems;
  const day = madridDay(new Date(candidate.published)).date;
  if (item.published !== day) problems.push(`${label} must carry its source's date, ${day}`);
  problems.push(...copiedProblem(label, itemText(item), [candidate.title, candidate.excerpt, item.preview?.title ?? '', item.preview?.description ?? '']));
  return problems;
}

function leadProblems(lead: SundayItem | null, sources: Sources): string[] {
  if (lead === null) return ['the issue has no lead story'];
  const label = `the lead story "${lead.headline}"`;
  const problems = storyProblems(lead, 'golf', LEAD_WORDS, sources, label);
  if ((lead.preview?.image ?? null) === null) problems.push(`${label} has no picture from its source; run preview, or lead with a story whose page has one`);
  return problems;
}

function quickHitProblems(hits: readonly SundayQuickHit[], sources: Sources): string[] {
  const problems = hits.length < MIN_QUICK_HITS || hits.length > MAX_QUICK_HITS ? [`${hits.length} quick hits; ${MIN_QUICK_HITS} to ${MAX_QUICK_HITS} allowed`] : [];
  hits.forEach((hit, at) => {
    const label = `quick hit ${at + 1}`;
    problems.push(...oneLineProblems(hit.text, QUICK_HIT_WORDS, label));
    const { problems: linked, candidate } = sourceProblems(label, hit, 'golf', sources);
    problems.push(...linked);
    if (candidate !== null) problems.push(...copiedProblem(label, hit.text, [candidate.title, candidate.excerpt]));
  });
  return problems;
}

function eventSourceProblems(event: SundayEvent, label: string, sources: Sources): string[] {
  const candidate = sources.byUrl.get(event.sourceUrl);
  if (candidate !== undefined) {
    const { problems } = sourceProblems(label, event, 'golf', sources);
    return [...problems, ...copiedProblem(label, event.whyWatch, [candidate.title, candidate.excerpt])];
  }
  const tour = tourScheduleFor(event.sourceUrl);
  if (tour === null) return [`${label} links ${event.sourceUrl}, which is neither a collected story nor a tour's schedule`];
  if (cleanHttps(event.sourceUrl) === null) return [`${label} links ${event.sourceUrl}, which is not a clean https link`];
  if (sources.seen.has(event.sourceUrl) && !sources.scheduleUrls.has(event.sourceUrl)) return [`${label} repeats a source`];
  sources.seen.add(event.sourceUrl);
  sources.scheduleUrls.add(event.sourceUrl);
  return event.sourceLabel === tour.name ? [] : [`${label} must credit "${tour.name}"`];
}

function eventProblems(events: readonly SundayEvent[] | null, issueDate: string, sources: Sources): string[] {
  if (events === null) return ['the issue has no This week box'];
  const problems = events.length > MAX_EVENTS ? [`${events.length} events this week; at most ${MAX_EVENTS} allowed`] : [];
  const firstDay = isSunday(issueDate) ? addDays(issueDate, 1) : '';
  const lastDay = isSunday(issueDate) ? addDays(issueDate, 7) : '';
  for (const event of events) {
    const label = `the event "${event.name}"`;
    if (event.name.trim() === '') problems.push('an event has no name');
    if (event.venue.trim() === '') problems.push(`${label} has no venue`);
    if (!isIsoDay(event.starts) || !isIsoDay(event.ends) || event.ends < event.starts) problems.push(`${label} needs yyyy-mm-dd starts and ends, ends on or after starts`);
    else if (event.starts < firstDay || event.starts > lastDay) problems.push(`${label} starts ${event.starts}, outside the coming week (${firstDay} to ${lastDay})`);
    problems.push(...oneLineProblems(event.whyWatch, WHY_WORDS, `${label}'s line on why to watch`));
    problems.push(...eventSourceProblems(event, label, sources));
  }
  return problems;
}

function tipProblems(tip: SundayTip | null, sources: Sources): string[] {
  if (tip === null) return ['the issue has no For your Sunday round tip'];
  const label = `the Sunday round tip "${tip.headline}"`;
  const problems = tip.headline.trim() === '' ? ['the Sunday round tip has no headline'] : [];
  problems.push(...wordProblem(tip.body, TIP_WORDS, label));
  const { problems: linked, candidate } = sourceProblems(label, tip, 'golf', sources);
  problems.push(...linked);
  if (candidate !== null) problems.push(...copiedProblem(label, tipText(tip), [candidate.title, candidate.excerpt]));
  return problems;
}

function sectionProblems(section: SundaySection, sources: Sources): string[] {
  const problems: string[] = [];
  if (section.items.length === 0) problems.push(`the ${section.key} section is empty; drop it`);
  if (section.key === 'golf' && DISC_GOLF_WORDS.test(sectionText(section))) problems.push('disc golf is named in the Golf section');
  for (const item of section.items) problems.push(...storyProblems(item, section.key, BODY_WORDS, sources));
  return problems;
}

function copyProblems(issue: SundayIssue): string[] {
  const texts = [...outsideSectionsText(issue), ...issue.sections.map(sectionText)];
  const broken = COPY_RULES.filter((rule) => texts.some((text) => rule.pattern.test(text))).map((rule) => rule.reason);
  const promoting = [...new Set(texts.flatMap(promotionReasons))];
  return [...broken, ...promoting].map((reason) => `the copy ${reason}`);
}

function fieldProblem(value: unknown, fields: readonly string[], label: string): string[] {
  if (isRecord(value) && hasExactKeys(value, fields)) return [];
  return [`${label} must have exactly the fields ${fields.join(', ')}`];
}

function storyShapeProblems(item: unknown, label: string): string[] {
  const problems = fieldProblem(item, ITEM_FIELDS, label);
  const preview = isRecord(item) ? item.preview : null;
  if (preview !== null) problems.push(...fieldProblem(preview, PREVIEW_FIELDS, 'each preview'));
  return problems;
}

function listShapeProblems(value: unknown, fields: readonly string[], label: string): string[] {
  return (Array.isArray(value) ? value : []).flatMap((entry: unknown) => fieldProblem(entry, fields, label));
}

export function shapeProblems(value: unknown): readonly string[] {
  const problems = fieldProblem(value, ISSUE_FIELDS, 'the issue');
  if (!isRecord(value)) return problems;
  if (value.lead !== null && value.lead !== undefined) problems.push(...storyShapeProblems(value.lead, 'the lead story'));
  problems.push(...listShapeProblems(value.quickHits, QUICK_HIT_FIELDS, 'each quick hit'));
  problems.push(...listShapeProblems(value.thisWeek, EVENT_FIELDS, 'each event'));
  if (value.sundayRound !== null && value.sundayRound !== undefined) problems.push(...fieldProblem(value.sundayRound, TIP_FIELDS, 'the Sunday round tip'));
  const sections = Array.isArray(value.sections) ? value.sections : [];
  for (const section of sections) {
    problems.push(...fieldProblem(section, SECTION_FIELDS, 'each section'));
    const items = isRecord(section) && Array.isArray(section.items) ? section.items : [];
    for (const item of items) problems.push(...storyShapeProblems(item, 'each item'));
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
  const stories = (issue.lead === null ? 0 : 1) + issue.sections.reduce((sum, section) => sum + section.items.length, 0);
  if (stories < 1 || stories > MAX_ITEMS) problems.push(`${stories} stories with the lead; 1 to ${MAX_ITEMS} allowed`);
  const sources: Sources = {
    byUrl: new Map(context.candidates.candidates.map((candidate) => [candidate.link, candidate])),
    seen: new Set<string>(),
    scheduleUrls: new Set<string>(),
    window: isSunday(issue.slug) ? itemWindow(issue.slug) : { from: new Date(0), to: new Date(0) },
  };
  problems.push(...leadProblems(issue.lead, sources));
  for (const section of issue.sections) problems.push(...sectionProblems(section, sources));
  problems.push(...quickHitProblems(issue.quickHits, sources));
  problems.push(...tipProblems(issue.sundayRound, sources));
  problems.push(...eventProblems(issue.thisWeek, issue.slug, sources));
  return problems;
}
