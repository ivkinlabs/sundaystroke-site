import { validated } from './issueCheck.ts';
import { cleanHttps, previewShown } from './rules.ts';
import { sourcePage } from './site.ts';
import { statePaths, writeJson } from './state.ts';
import type { SundayItem, SundayPreview } from '../src/types/sunday.ts';

const META_TAG: RegExp = /<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const ATTRIBUTE: RegExp = /([a-z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const ENTITIES: Readonly<Record<string, string>> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
const DESCRIPTION_CHARS: number = 200;

function decoded(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity: string, name: string) => {
    const code = name.startsWith('#') ? Number(name[1] === 'x' || name[1] === 'X' ? `0${name.slice(1)}` : name.slice(1)) : 0;
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : (ENTITIES[name.toLowerCase()] ?? entity);
  }).replace(/\s+/g, ' ').trim();
}

function metaTags(html: string): ReadonlyMap<string, string> {
  const found = new Map<string, string>();
  for (const [tag] of (html.split(/<\/head\s*>/i)[0] ?? '').matchAll(META_TAG)) {
    const attributes = new Map([...tag.matchAll(ATTRIBUTE)].map((match) => [(match[1] ?? '').toLowerCase(), match[2] ?? match[3] ?? '']));
    const key = (attributes.get('property') ?? attributes.get('name') ?? '').toLowerCase();
    const content = attributes.get('content');
    if (key !== '' && content !== undefined && !found.has(key)) found.set(key, decoded(content));
  }
  return found;
}

export function previewFrom(html: string, pageUrl: string, sourceLabel: string): SundayPreview | null {
  const meta = metaTags(html);
  const summary = meta.get('og:description') || meta.get('description') || '';
  const cut = summary.slice(0, DESCRIPTION_CHARS);
  const preview = {
    title: meta.get('og:title') ?? '',
    siteName: meta.get('og:site_name') || sourceLabel,
    description: summary.length <= DESCRIPTION_CHARS ? summary : `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 1)).replace(/[\s,;:.–-]+$/, '')}…`,
    image: cleanHttps(meta.get('og:image') ?? '', pageUrl),
  };
  return previewShown(preview) ? preview : null;
}

async function withPreview(item: SundayItem): Promise<SundayItem> {
  const page = await sourcePage(item.sourceUrl);
  return { ...item, preview: page === null ? null : previewFrom(page.html, page.url, item.sourceLabel) };
}

export async function commandPreview(issueDate: string): Promise<void> {
  const issue = validated(issueDate);
  const sections = await Promise.all(issue.sections.map(async (section) => ({ ...section, items: await Promise.all(section.items.map(withPreview)) })));
  writeJson(statePaths(issueDate).issueFile, { ...issue, sections });
}
