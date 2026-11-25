import { readFileSync, writeFileSync } from 'node:fs';
import { parseCurrentIssue } from '../src/lib/sundayIssue.ts';
import { fetchText } from './site.ts';
import { PREVIEW_DESCRIPTION_CHARS } from './sources.ts';
import { readCandidates, statePaths } from './state.ts';
import type { Candidate } from './types.ts';
import type { CurrentIssue, SourcePreview, SundayStory } from '../src/types/sunday.ts';

type MetaTags = ReadonlyMap<string, string>;

const NAMED_ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…' };

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole: string, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return NAMED_ENTITIES[entity.toLowerCase()] ?? whole;
  });
}

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  if (match === null) return null;
  return match[1] ?? match[2] ?? null;
}

export function metaTags(html: string): MetaTags {
  const head = html.split(/<\/head>/i)[0] ?? html;
  const tags = new Map<string, string>();
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const key = attribute(tag, 'property') ?? attribute(tag, 'name');
    const content = attribute(tag, 'content');
    if (key === null || content === null) continue;
    const name = key.toLowerCase();
    if (!tags.has(name)) tags.set(name, decodeEntities(content).replace(/\s+/g, ' ').trim());
  }
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1];
  if (title !== undefined && !tags.has('title')) tags.set('title', decodeEntities(title).replace(/\s+/g, ' ').trim());
  return tags;
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
  if (value === '') return null;
  try {
    const url = new URL(value, pageUrl);
    return url.protocol === 'https:' && !/[\s"'<>]/.test(url.href) ? url.href : null;
  } catch {
    return null;
  }
}

export function previewFrom(html: string, pageUrl: string, candidate: Candidate): SourcePreview {
  const tags = metaTags(html);
  return {
    title: first(tags, ['og:title', 'twitter:title', 'title']) || candidate.title,
    siteName: first(tags, ['og:site_name']) || candidate.sourceName,
    description: shortened(first(tags, ['og:description', 'twitter:description', 'description']) || candidate.excerpt, PREVIEW_DESCRIPTION_CHARS),
    image: httpsImage(first(tags, ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']), pageUrl),
  };
}

export function textCard(candidate: Candidate): SourcePreview {
  return { title: candidate.title, siteName: candidate.sourceName, description: shortened(candidate.excerpt, PREVIEW_DESCRIPTION_CHARS), image: null };
}

async function storyPreview(story: SundayStory, byUrl: ReadonlyMap<string, Candidate>): Promise<SourcePreview> {
  const candidate = byUrl.get(story.sourceUrl);
  if (candidate === undefined) throw new Error(`"${story.headline}" links ${story.sourceUrl}, which is not one of this week's collected stories`);
  try {
    return previewFrom(await fetchText(story.sourceUrl), story.sourceUrl, candidate);
  } catch (error) {
    console.log(`no share card for ${story.sourceUrl}, using a text card: ${error instanceof Error ? error.message : String(error)}`);
    return textCard(candidate);
  }
}

export async function withPreviews(issue: CurrentIssue, candidates: readonly Candidate[]): Promise<CurrentIssue> {
  const byUrl = new Map(candidates.map((candidate) => [candidate.link, candidate]));
  const sections = [];
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
