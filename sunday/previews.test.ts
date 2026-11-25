import { describe, expect, it } from 'vitest';
import { metaTags, previewFrom } from './previews.ts';

const PAGE: string = 'https://www.espn.com/golf/story/_/id/1/duncan-wins';

const html = (head: string): string => `<html><head>${head}</head><body><p>Story</p></body></html>`;

describe('source previews', () => {
  it('reads the Open Graph card in any attribute order, with entities decoded', () => {
    const page = html(
      '<meta content="Duncan wins &amp; makes history" property="og:title">' +
        "<meta property='og:site_name' content='ESPN'>" +
        '<meta property="og:description" content="Lindy Duncan won at the 222nd try &#8212; a first title.">' +
        '<meta property="og:image" content="/photos/duncan.jpg">',
    );
    expect(metaTags(page).get('og:title')).toBe('Duncan wins & makes history');
    expect(previewFrom(page, PAGE, 'ESPN')).toEqual({
      title: 'Duncan wins & makes history',
      siteName: 'ESPN',
      description: 'Lindy Duncan won at the 222nd try — a first title.',
      image: 'https://www.espn.com/photos/duncan.jpg',
    });
  });

  it('falls back to a plain text card when the page has no Open Graph title', () => {
    expect(previewFrom(html('<title>Just a title</title><meta name="description" content="x">'), PAGE, 'ESPN')).toBeNull();
  });

  it('keeps no image that is not https, and credits the feed when the site has no name', () => {
    const preview = previewFrom(html('<meta property="og:title" content="A title"><meta property="og:image" content="http://cdn.example.com/a.jpg">'), PAGE, 'ESPN');
    expect(preview).toEqual({ title: 'A title', siteName: 'ESPN', description: '', image: null });
  });

  it('drops source text that would promote an app, and shortens a long description', () => {
    const page = html(`<meta property="og:title" content="Get the ESPN app for live golf"><meta property="og:description" content="${'word '.repeat(80)}">`);
    expect(previewFrom(page, PAGE, 'ESPN')).toBeNull();
    const long = previewFrom(html(`<meta property="og:title" content="A title"><meta property="og:description" content="${'word '.repeat(80)}">`), PAGE, 'ESPN');
    expect(long?.description.endsWith('…')).toBe(true);
    expect((long?.description.length ?? 0) <= 201).toBe(true);
    const appDescription = previewFrom(html('<meta property="og:title" content="A title"><meta property="og:description" content="Download now.">'), PAGE, 'ESPN');
    expect(appDescription?.description).toBe('');
  });
});
