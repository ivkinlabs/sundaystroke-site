import { describe, expect, it } from 'vitest';
import { previewFrom } from './previews.ts';

describe('previewFrom', () => {
  it('reads the share card from the page head', () => {
    const page = `<head><meta property="og:title" content="Smith&#39;s first title"><meta property='og:site_name' content='BBC Sport'>
<meta name="description" content="A 63 &amp; seven birdies."><meta property="og:image" content="/news/1.jpg"></head><meta property="og:title" content="body">`;
    expect(previewFrom(page, 'https://www.bbc.co.uk/sport/golf/1', 'BBC')).toEqual({ title: "Smith's first title", siteName: 'BBC Sport', description: 'A 63 & seven birdies.', image: 'https://www.bbc.co.uk/news/1.jpg' });
  });

  it('credits the feed, drops an http image, shortens a long summary and refuses a card with no title or promoting an app', () => {
    const page = `<meta property="og:title" content="Worlds move"><meta property="og:description" content="${'word '.repeat(80)}"><meta property="og:image" content="http://x.org/a.jpg">`;
    expect(previewFrom(page, 'https://www.pdga.com/news/1', 'PDGA')).toMatchObject({ siteName: 'PDGA', image: null, description: `${'word '.repeat(39)}word…` });
    expect(previewFrom('<p>no card</p>', 'https://a.org/', 'A')).toBeNull();
    expect(previewFrom('<meta property="og:title" content="Get the ESPN app">', 'https://espn.com/1', 'ESPN')).toBeNull();
  });
});
