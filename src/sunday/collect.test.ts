import { describe, expect, it } from 'vitest';
import { inWindow, uniqueByLink } from './collect.ts';
import type { Candidate } from './types.ts';

const story = (link: string, published: string, sourceName: string = 'GOLF.com'): Candidate => ({
  title: 't',
  link,
  published,
  excerpt: 'e',
  sourceName,
  section: sourceName === 'PDGA' ? 'tracer' : 'golf',
});

describe('collect', () => {
  const window = { since: new Date('2026-11-07T23:00:00Z'), until: new Date('2026-11-13T09:00:00Z') };

  it('keeps stories between the window start and the moment of collection only', () => {
    expect(inWindow(story('https://a/1', '2026-11-08T10:00:00Z'), window)).toBe(true);
    expect(inWindow(story('https://a/2', '2026-11-07T22:59:00Z'), window)).toBe(false);
    expect(inWindow(story('https://a/3', '2026-11-14T08:00:00Z'), window)).toBe(false);
  });

  it('keeps the first feed that carried a link, so a story never changes section', () => {
    const kept = uniqueByLink([story('https://a/1', '2026-11-08T10:00:00Z'), story('https://a/1', '2026-11-08T10:00:00Z', 'PDGA')]);
    expect(kept.map((candidate) => candidate.sourceName)).toEqual(['GOLF.com']);
  });
});
