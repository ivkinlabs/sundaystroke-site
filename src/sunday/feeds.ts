import { EXCERPT_CHARS } from './sources.ts';
import type { FeedEntry } from './types.ts';

const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  hellip: '…',
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole: string, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X')) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

function unwrapCdata(text: string): string {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

export function plainText(markup: string): string {
  const once = decodeEntities(unwrapCdata(markup));
  return decodeEntities(once.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function field(block: string, names: readonly string[]): string | null {
  for (const name of names) {
    const match = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i').exec(block);
    if (match?.[1] !== undefined) return match[1];
  }
  return null;
}

function atomLink(block: string): string | null {
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map((match) => match[1] ?? '');
  const preferred = links.find((attributes) => !/rel="(?!alternate)/i.test(attributes)) ?? links[0];
  if (preferred === undefined) return null;
  return /href="([^"]+)"/i.exec(preferred)?.[1] ?? null;
}

export function excerptOf(text: string): string {
  if (text.length <= EXCERPT_CHARS) return text;
  const cut = text.slice(0, EXCERPT_CHARS);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : EXCERPT_CHARS)}…`;
}

export function cleanLink(link: string): string {
  const url = new URL(decodeEntities(link).trim());
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('utm_')) url.searchParams.delete(key);
  }
  return url.toString();
}

function entry(block: string): FeedEntry | null {
  const title = field(block, ['title']);
  const rawLink = field(block, ['link']);
  const link = rawLink !== null && rawLink.trim() !== '' ? plainText(rawLink) : atomLink(block);
  const date = field(block, ['pubDate', 'published', 'updated', 'dc:date']);
  if (title === null || link === null || date === null) return null;
  const published = new Date(plainText(date));
  if (Number.isNaN(published.getTime()) || !/^https:\/\//.test(link)) return null;
  const summary = field(block, ['description', 'summary', 'content:encoded', 'content', 'dc:content']) ?? '';
  return {
    title: plainText(title),
    link: cleanLink(link),
    published: published.toISOString(),
    excerpt: excerptOf(plainText(summary)),
  };
}

export function parseFeed(xml: string): readonly FeedEntry[] {
  const blocks = [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => match[2] ?? '');
  return blocks.map(entry).filter((found): found is FeedEntry => found !== null);
}
