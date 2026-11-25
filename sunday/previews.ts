import { readFileSync, writeFileSync } from 'node:fs';
import { madridDay } from './calendar.ts';
import { promotionReasons } from './promotion.ts';
import { shapeProblems } from './rules.ts';
import { pageTextOrNull } from './site.ts';
import { COPY_RULES, PREVIEW_DESCRIPTION_CHARS } from './sources.ts';
import { readCandidates, statePaths } from './state.ts';
import type { Candidate } from './types.ts';
import { parseIssue } from '../src/lib/sundayIssue.ts';
import type { SundayIssue, SundayItem, SundayPreview, SundaySection } from '../src/types/sunday.ts';

const META_TAG: RegExp = /<meta\b[^>]*>/gi;
const ATTRIBUTE: RegExp = /([a-z:-]+)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const ENTITIES: Readonly<Record<string, string>> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };

function decoded(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&([a-z]+);/gi, (entity: string, name: string) => ENTITIES[name.toLowerCase()] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
}

export function metaTags(html: string): ReadonlyMap<string, string> {
  const found = new Map<string, string>();
  for (const [tag] of html.matchAll(META_TAG)) {
    const attributes = new Map<string, string>();
    for (const match of tag.matchAll(ATTRIBUTE)) attributes.set((match[1] ?? '').toLowerCase(), match[3] ?? match[4] ?? '');
    const key = (attributes.get('property') ?? attributes.get('name') ?? '').toLowerCase();
    const content = attributes.get('content');
    if (key !== '' && content !== undefined && !found.has(key)) found.set(key, decoded(content));
  }
  return found;
}

function shortened(text: string): string {
  if (text.length <= PREVIEW_DESCRIPTION_CHARS) return text;
  const cut = text.slice(0, PREVIEW_DESCRIPTION_CHARS);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 1)).replace(/[\s,;:.–-]+$/, '')}…`;
}

function imageUrl(value: string | undefined, pageUrl: string): string | null {
  if (value === undefined || value === '') return null;
  try {
    const url = new URL(value, pageUrl);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function safe(text: string): boolean {
  return promotionReasons(text).length === 0 && !COPY_RULES.some((rule) => rule.pattern.test(text));
}

export function previewFrom(html: string, pageUrl: string, sourceLabel: string): SundayPreview | null {
  const meta = metaTags(html);
  const first = (...keys: readonly string[]): string => keys.map((key) => meta.get(key) ?? '').find((value) => value !== '') ?? '';
  const title = first('og:title', 'twitter:title');
  if (title === '' || !safe(title)) return null;
  const siteName = first('og:site_name');
  const description = shortened(first('og:description', 'twitter:description', 'description'));
  return {
    title,
    siteName: siteName !== '' && safe(siteName) ? siteName : sourceLabel,
    description: safe(description) ? description : '',
    image: imageUrl(first('og:image:secure_url', 'og:image', 'twitter:image'), pageUrl),
  };
}

async function withSource(item: SundayItem, candidate: Candidate | undefined): Promise<SundayItem> {
  if (candidate === undefined) throw new Error(`"${item.headline}" links ${item.sourceUrl}, which is not one of this week's collected stories`);
  const html = await pageTextOrNull(item.sourceUrl);
  const preview = html === null ? null : previewFrom(html, item.sourceUrl, item.sourceLabel);
  console.log(`${preview === null ? 'text card' : 'preview'} ${item.sourceUrl}`);
  return { ...item, published: madridDay(new Date(candidate.published)).date, preview };
}

export async function withSources(issue: SundayIssue, candidates: readonly Candidate[]): Promise<SundayIssue> {
  const byUrl = new Map(candidates.map((candidate) => [candidate.link, candidate]));
  const sections: SundaySection[] = [];
  for (const section of issue.sections) {
    const items: SundayItem[] = [];
    for (const item of section.items) items.push(await withSource(item, byUrl.get(item.sourceUrl)));
    sections.push({ ...section, items });
  }
  return { ...issue, sections };
}

export async function commandPreview(issueDate: string): Promise<void> {
  const paths = statePaths(issueDate);
  const json = readFileSync(paths.issueFile, 'utf8');
  const problems = shapeProblems(JSON.parse(json));
  if (problems.length > 0) throw new Error(`${paths.issueFile} has the wrong shape:\n- ${problems.join('\n- ')}`);
  const issue = parseIssue(json, paths.issueFile);
  const filled = await withSources(issue, readCandidates(paths.candidates).candidates);
  writeFileSync(paths.issueFile, `${JSON.stringify(filled, null, 2)}\n`);
}
