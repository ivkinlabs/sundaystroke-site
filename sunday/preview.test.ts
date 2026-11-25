import { describe, expect, it } from 'vitest';
import { decodeEntities, isSafeImageUrl, metaTags, previewFrom, shortened, textCard } from './preview.ts';
import type { Candidate, FetchedPage } from './types.ts';

const CANDIDATE: Candidate = {
  title: 'Lindy Duncan wins The Annika',
  link: 'https://www.espn.com/golf/story/1',
  published: '2026-11-27T10:00:00.000Z',
  excerpt: 'Feed excerpt.',
  sourceName: 'ESPN',
  section: 'golf',
};

const HTML = `<!doctype html><html><head>
<title>Page title - ESPN</title>
<!-- <meta property="og:title" content="A commented-out title"> -->
<script>var tag = '<meta property="og:description" content="from a script">';</script>
<meta content="Duncan&#8217;s first win &amp; more &eacute;" property="og:title">
<meta property='og:site_name' content='ESPN.com'>
<meta name="description" content="Plain description">
<meta property="og:description" content="Lindy Duncan wins &quot;The Annika&quot; by 2 &gt; 1.">
<meta property="og:image" content="/photos/duncan.jpg">
</head><body><meta property="og:title" content="Not in the head"></body></html>`;

function page(html: string, url: string = CANDIDATE.link): FetchedPage {
  return { html, url };
}

describe('previewFrom', () => {
  it("reads the page's own share card: title, site, description and image", () => {
    expect(previewFrom(page(HTML), CANDIDATE)).toEqual({
      title: 'Duncan’s first win & more é',
      siteName: 'ESPN.com',
      description: 'Lindy Duncan wins "The Annika" by 2 > 1.',
      image: 'https://www.espn.com/photos/duncan.jpg',
    });
  });

  it('resolves a relative image against the address the page was served from after redirects', () => {
    expect(previewFrom(page(HTML, 'https://www.espn.com/golf/redirected/1'), CANDIDATE).image).toBe('https://www.espn.com/photos/duncan.jpg');
    const relative = '<head><meta property="og:title" content="Duncan wins"><meta property="og:image" content="pic.jpg"></head>';
    expect(previewFrom(page(relative, 'https://cdn.espn.com/a/b/story'), CANDIDATE).image).toBe('https://cdn.espn.com/a/b/pic.jpg');
  });

  it('falls back to the page title, the feed and no image when the page has no share card', () => {
    expect(previewFrom(page('<html><head><title>Duncan wins in Florida</title></head></html>'), CANDIDATE)).toEqual({
      title: 'Duncan wins in Florida',
      siteName: 'ESPN',
      description: 'Feed excerpt.',
      image: null,
    });
  });

  it('uses a text card when the page is a bot wall or consent page instead of the story', () => {
    const wall = '<head><title>Just a moment...</title><meta property="og:image" content="https://x.example/wall.png"></head>';
    expect(previewFrom(page(wall), CANDIDATE)).toEqual(textCard(CANDIDATE));
  });

  it('never keeps an image that is not served over https', () => {
    const html = '<head><meta property="og:image" content="http://cdn.example.com/a.jpg"><meta property="og:title" content="Duncan"></head>';
    expect(previewFrom(page(html), CANDIDATE).image).toBeNull();
  });
});

describe('metaTags', () => {
  it('reads unquoted values and values holding a ">"', () => {
    const tags = metaTags('<head><meta property=og:title content=Duncan><meta name="description" content="a > b"></head>');
    expect(tags.get('og:title')).toBe('Duncan');
    expect(tags.get('description')).toBe('a > b');
  });
});

describe('isSafeImageUrl', () => {
  it('accepts plain https addresses only', () => {
    expect(isSafeImageUrl('https://cdn.example.com/a.jpg')).toBe(true);
    expect(isSafeImageUrl('http://cdn.example.com/a.jpg')).toBe(false);
    expect(isSafeImageUrl('https://user:pw@cdn.example.com/a.jpg')).toBe(false);
    expect(isSafeImageUrl('https://cdn.example.com/a b.jpg')).toBe(false);
    expect(isSafeImageUrl(`https://cdn.example.com/${'a'.repeat(2100)}.jpg`)).toBe(false);
  });
});

describe('text helpers', () => {
  it('builds a plain text card from the feed', () => {
    expect(textCard(CANDIDATE)).toEqual({ title: 'Lindy Duncan wins The Annika', siteName: 'ESPN', description: 'Feed excerpt.', image: null });
  });

  it('shortens long descriptions on a word boundary', () => {
    expect(shortened('one two three four five', 14)).toBe('one two three…');
    expect(shortened('short', 14)).toBe('short');
  });

  it('decodes named and numeric entities and leaves impossible ones as written', () => {
    expect(decodeEntities('&lt;a&gt; &#39;b&#x27; &unknown; &pound;5 &Ouml;')).toBe("<a> 'b' &unknown; £5 Ö");
    expect(decodeEntities('&#x110000; &#99999999; &#0;')).toBe('&#x110000; &#99999999; &#0;');
  });
});
