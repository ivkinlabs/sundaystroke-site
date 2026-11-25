import { describe, expect, it } from 'vitest';
import { decodeEntities, previewFrom, shortened, textCard } from './preview.ts';
import type { Candidate } from './types.ts';

const CANDIDATE: Candidate = {
  title: 'Feed title',
  link: 'https://www.espn.com/golf/story/1',
  published: '2026-11-27T10:00:00.000Z',
  excerpt: 'Feed excerpt.',
  sourceName: 'ESPN',
  section: 'golf',
};

const PAGE = `<!doctype html><html><head>
<title>Page title - ESPN</title>
<meta content="Duncan&#8217;s first win &amp; more" property="og:title">
<meta property='og:site_name' content='ESPN.com'>
<meta name="description" content="Plain description">
<meta property="og:description" content="Lindy Duncan wins &quot;The Annika&quot;.">
<meta property="og:image" content="/photos/duncan.jpg">
</head><body><meta property="og:title" content="Not in the head"></body></html>`;

describe('previewFrom', () => {
  it("reads the page's own share card: title, site, description and image", () => {
    expect(previewFrom(PAGE, CANDIDATE.link, CANDIDATE)).toEqual({
      title: 'Duncan’s first win & more',
      siteName: 'ESPN.com',
      description: 'Lindy Duncan wins "The Annika".',
      image: 'https://www.espn.com/photos/duncan.jpg',
    });
  });

  it('falls back to the page title, the feed and no image when the page has no share card', () => {
    expect(previewFrom('<html><head><title>Only a title</title></head></html>', CANDIDATE.link, CANDIDATE)).toEqual({
      title: 'Only a title',
      siteName: 'ESPN',
      description: 'Feed excerpt.',
      image: null,
    });
  });

  it('never keeps an image that is not served over https', () => {
    const page = '<head><meta property="og:image" content="http://cdn.example.com/a.jpg"><meta property="og:title" content="T"></head>';
    expect(previewFrom(page, CANDIDATE.link, CANDIDATE).image).toBeNull();
  });
});

describe('text helpers', () => {
  it('builds a plain text card from the feed', () => {
    expect(textCard(CANDIDATE)).toEqual({ title: 'Feed title', siteName: 'ESPN', description: 'Feed excerpt.', image: null });
  });

  it('shortens long descriptions on a word boundary', () => {
    expect(shortened('one two three four five', 14)).toBe('one two three…');
    expect(shortened('short', 14)).toBe('short');
  });

  it('decodes named and numeric entities', () => {
    expect(decodeEntities('&lt;a&gt; &#39;b&#x27; &unknown;')).toBe("<a> 'b' &unknown;");
  });
});
