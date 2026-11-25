import { describe, expect, it } from 'vitest';
import { sundayPageProblems } from './promotion.ts';

const page = (article: string): string => `<header><a href="/tracer/">Tracer</a></header><main><article>${article}</article></main><footer>Golf GPS app</footer>`;

describe('sundayPageProblems', () => {
  it('accepts an issue with no promotion, leaving the site header and footer alone', () => {
    expect(sundayPageProblems(page('<h2>Golf</h2><p>Duncan won.</p>'))).toEqual([]);
  });

  it('ignores words inside a linked source preview card, which is the source page in its own words', () => {
    const card = '<a data-source-preview href="https://example.com"><span>Their new app is out</span></a>';
    expect(sundayPageProblems(page(`<p>Duncan won.</p>${card}`))).toEqual([]);
  });

  it('fails a page that names an app, links a store or shows a clip', () => {
    expect(sundayPageProblems(page('<h2>For Tracer: disc golf</h2>'))).toEqual(['names "Tracer"']);
    expect(sundayPageProblems(page('<a href="https://apps.apple.com/app/id6821717424">Get it</a>'))).toContain('links to an app store');
    expect(sundayPageProblems(page('<video src="/media/a.mp4"></video>'))).toContain('shows a video clip');
    expect(sundayPageProblems(page('<p>Download it today.</p>'))).toEqual(['names "Download"']);
  });
});
