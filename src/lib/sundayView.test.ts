import { describe, expect, it } from 'vitest';
import { issueView } from './sundayView.ts';
import { SUNDAY_ISSUES } from '../data/sunday.ts';
import { ISSUE_TWO } from '../../sunday/testIssue.ts';

describe('issueView', () => {
  it("shows a current issue's note, dated stories, why it matters and previews, numbered across sections", () => {
    const view = issueView(ISSUE_TWO);
    expect(view.editorsNote).toBe(ISSUE_TWO.editorsNote);
    expect(view.sections.map((part) => [part.heading, part.anchor])).toEqual([['Golf', 'section-golf'], ['Disc golf', 'section-disc-golf']]);
    const stories = view.sections.flatMap((part) => part.stories);
    expect(stories.map((story) => story.anchor)).toEqual(['story-1', 'story-2']);
    expect(stories[0]?.published).toEqual({ iso: '2026-11-15', label: '15 November 2026' });
    expect(stories[0]?.whyItMatters).toContain('putting routine');
    expect(stories[0]?.preview?.image).toBe('https://ichef.bbci.co.uk/news/1024/a.jpg');
  });

  it('renders earlier issues as published, without their lead, and with disc golf under its own name', () => {
    const issueTwo = SUNDAY_ISSUES.find((issue) => issue.slug === '2026-11-22');
    if (issueTwo === undefined || issueTwo.format !== 1) throw new Error('the 22 November issue should be in the earlier format');
    const view = issueView(issueTwo);
    expect(view.editorsNote).toBeNull();
    expect(view.sections.map((part) => part.heading)).toEqual(['Golf', 'Disc golf']);
    const stories = view.sections.flatMap((part) => part.stories);
    expect(stories.map((story) => story.body)).toEqual(issueTwo.sections.flatMap((part) => part.items.map((item) => item.body)));
    expect(stories.every((story) => story.preview === null && story.whyItMatters === null && story.published === null)).toBe(true);
  });
});
