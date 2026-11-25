import { readFileSync, writeFileSync } from 'node:fs';
import { parseCurrentIssue } from '../src/lib/sundayIssue.ts';
import { fetchPageHead } from './site.ts';
import { PREVIEW_DESCRIPTION_CHARS } from './sources.ts';
import { readCandidates, statePaths } from './state.ts';
import { sharesWord } from './text.ts';
import type { Candidate, FetchedPage } from './types.ts';
import type { CurrentIssue, SourcePreview, SundaySection, SundayStory } from '../src/types/sunday.ts';

type MetaTags = ReadonlyMap<string, string>;

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…',
  bull: '•', middot: '·', laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™', deg: '°', pound: '£', euro: '€', cent: '¢', yen: '¥', times: '×', frac12: '½',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', agrave: 'à', egrave: 'è', ograve: 'ò', acirc: 'â', ecirc: 'ê', ocirc: 'ô',
  auml: 'ä', euml: 'ë', iuml: 'ï', ouml: 'ö', uuml: 'ü', ntilde: 'ñ', ccedil: 'ç', aring: 'å', oslash: 'ø', aelig: 'æ', szlig: 'ß',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', Ntilde: 'Ñ', Ccedil: 'Ç', Aring: 'Å', Oslash: 'Ø', AElig: 'Æ',
};
const MAX_CODE_POINT: number = 0x10ffff;
const IMAGE_URL_MAX_CHARS: number = 2000;
const META_TAG: RegExp = /<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const HIDDEN_HEAD_PARTS: RegExp = /<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<noscript\b[\s\S]*?<\/noscript>/gi;

function codePoint(digits: string, radix: number, whole: string): string {
  const value = Number.parseInt(digits, radix);
  return Number.isInteger(value) && value > 0 && value <= MAX_CODE_POINT ? String.fromCodePoint(value) : whole;
}

export function decodeEntities(text: string): string {
  return text.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole: string, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) return codePoint(entity.slice(2), 16, whole);
    if (entity.startsWith('#')) return codePoint(entity.slice(1), 10, whole);
    return NAMED_ENTITIES[entity] ?? NAMED_ENTITIES[entity.toLowerCase()] ?? whole;
  });
}

function cleanText(text: string): string {
  return decodeEntities(text).replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i').exec(tag);
  if (match === null) return null;
  return match[1] ?? match[2] ?? match[3] ?? null;
}

export function metaTags(html: string): MetaTags {
  const head = (html.split(/<\/head>/i)[0] ?? html).replace(HIDDEN_HEAD_PARTS, ' ');
  const tags = new Map<string, string>();
  for (const [tag] of head.matchAll(META_TAG)) {
    const key = attribute(tag, 'property') ?? attribute(tag, 'name');
    const content = attribute(tag, 'content');
    if (key === null || content === null) continue;
    const name = key.toLowerCase();
    if (!tags.has(name)) tags.set(name, cleanText(content));
  }
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1];
  if (title !== undefined && !tags.has('title')) tags.set('title', cleanText(title));
  return tags;
}

export function isSafeImageUrl(href: string): boolean {
  if (href.length > IMAGE_URL_MAX_CHARS || /[\s"'<>]/.test(href)) return false;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' && url.username === '' && url.password === '' && url.href === href;
  } catch {
    return false;
  }
}

function first(tags: MetaTags, names: readonly string[]): string {
  for (const name of names) {
    const value = tags.get(name);
    if (value !== undefined && value !== '') return value;
  }
  return '';
}

export function shortened(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > limit / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, '')}…`;
}

function httpsImage(value: string, pageUrl: string): string | null {
  if (value === '' || !URL.canParse(value, pageUrl)) return null;
  const href = new URL(value, pageUrl).href;
  return isSafeImageUrl(href) ? href : null;
}

export function previewFrom(page: FetchedPage, candidate: Candidate): SourcePreview {
  const tags = metaTags(page.html);
  const title = first(tags, ['og:title', 'twitter:title', 'title']);
  if (title !== '' && !sharesWord(title, candidate.title)) return textCard(candidate);
  return {
    title: title || candidate.title,
    siteName: first(tags, ['og:site_name']) || candidate.sourceName,
    description: shortened(first(tags, ['og:description', 'twitter:description', 'description']) || candidate.excerpt, PREVIEW_DESCRIPTION_CHARS),
    image: httpsImage(first(tags, ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']), page.url),
  };
}

export function textCard(candidate: Candidate): SourcePreview {
  return { title: candidate.title, siteName: candidate.sourceName, description: shortened(candidate.excerpt, PREVIEW_DESCRIPTION_CHARS), image: null };
}

async function storyPreview(story: SundayStory, byUrl: ReadonlyMap<string, Candidate>): Promise<SourcePreview> {
  const candidate = byUrl.get(story.sourceUrl);
  if (candidate === undefined) throw new Error(`"${story.headline}" links ${story.sourceUrl}, which is not one of this week's collected stories`);
  let page: FetchedPage;
  try {
    page = await fetchPageHead(story.sourceUrl);
  } catch (error) {
    console.log(`no share card for ${story.sourceUrl}, using a text card: ${error instanceof Error ? error.message : String(error)}`);
    return textCard(candidate);
  }
  return previewFrom(page, candidate);
}

export async function withPreviews(issue: CurrentIssue, candidates: readonly Candidate[]): Promise<CurrentIssue> {
  const byUrl = new Map(candidates.map((candidate) => [candidate.link, candidate]));
  const sections: SundaySection[] = [];
  for (const section of issue.sections) {
    const items: SundayStory[] = [];
    for (const story of section.items) items.push({ ...story, preview: await storyPreview(story, byUrl) });
    sections.push({ ...section, items });
  }
  return { ...issue, sections };
}

export async function commandPreview(issueDate: string): Promise<void> {
  const paths = statePaths(issueDate);
  const issue = parseCurrentIssue(readFileSync(paths.issueFile, 'utf8'), paths.issueFile);
  const previewed = await withPreviews(issue, readCandidates(paths.candidates).candidates);
  writeFileSync(paths.issueFile, `${JSON.stringify(previewed, null, 2)}\n`);
  for (const story of previewed.sections.flatMap((section) => section.items)) {
    console.log(`${story.sourceUrl}: ${story.preview?.image === null ? 'text card' : 'share card with image'}`);
  }
}
