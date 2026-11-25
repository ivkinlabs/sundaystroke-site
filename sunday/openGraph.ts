import { promotionReasons } from './promotion.ts';
import { COPY_RULES, PREVIEW_DESCRIPTION_CHARS } from './sources.ts';
import type { SundayPreview } from '../src/types/sunday.ts';

const HEAD_END: RegExp = /<\/head\s*>/i;
const META_TAG: RegExp = /<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const ATTRIBUTE: RegExp = /([a-z:-]+)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const ENTITIES: Readonly<Record<string, string>> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
const MAX_CODE_POINT: number = 0x10ffff;

function character(code: number): string {
  return Number.isInteger(code) && code > 0 && code <= MAX_CODE_POINT ? String.fromCodePoint(code) : '';
}

function decoded(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => character(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => character(Number(decimal)))
    .replace(/&([a-z]+);/gi, (entity: string, name: string) => ENTITIES[name.toLowerCase()] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
}

function head(html: string): string {
  const end = HEAD_END.exec(html);
  return end === null ? html : html.slice(0, end.index);
}

export function metaTags(html: string): ReadonlyMap<string, string> {
  const found = new Map<string, string>();
  for (const [tag] of head(html).matchAll(META_TAG)) {
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

function imageUrl(value: string, pageUrl: string): string | null {
  if (value === '') return null;
  try {
    const url = new URL(value, pageUrl);
    return url.protocol === 'https:' && url.username === '' && url.password === '' ? url.href : null;
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
    image: imageUrl(first('og:image:secure_url', 'og:image:url', 'og:image', 'twitter:image'), pageUrl),
  };
}
