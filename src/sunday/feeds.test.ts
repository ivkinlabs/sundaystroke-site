import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { excerptOf, parseFeed } from './feeds.ts';
import { EXCERPT_CHARS } from './sources.ts';

const fixture = (name: string): string => readFileSync(join(__dirname, 'fixtures', name), 'utf8');

describe('parseFeed', () => {
  it('keeps dated https RSS items with their title, clean link, date and plain-text excerpt', () => {
    expect(parseFeed(fixture('rss.xml'))).toEqual([
      { title: 'Smith wins in & out', link: 'https://example.com/a?id=3', published: '2026-11-03T16:22:25.000Z', excerpt: 'Smith won by two.' },
    ]);
  });

  it('reads Atom entries', () => {
    expect(parseFeed(fixture('atom.xml'))).toEqual([
      { title: 'Atom story', link: 'https://example.org/story', published: '2026-11-05T10:00:00.000Z', excerpt: 'Short ’summary’.' },
    ]);
  });

  it('cuts long excerpts on a word boundary', () => {
    const excerpt = excerptOf('word '.repeat(200).trim());
    expect(excerpt.length).toBeLessThanOrEqual(EXCERPT_CHARS + 1);
    expect(excerpt.endsWith('word…')).toBe(true);
  });
});
