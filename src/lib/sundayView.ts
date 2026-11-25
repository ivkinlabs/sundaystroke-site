import { displayDate } from '../utils/dates.ts';
import type { CurrentIssue, IssueView, LegacyIssue, LegacySectionKey, SectionView, StoryView, SundayIssue, SundaySectionKey } from '../types/sunday.ts';

export const SECTION_HEADINGS: Readonly<Record<SundaySectionKey, string>> = {
  golf: 'Golf',
  discGolf: 'Disc golf',
};

const SECTION_ANCHORS: Readonly<Record<SundaySectionKey, string>> = {
  golf: 'golf',
  discGolf: 'disc-golf',
};

const LEGACY_KEYS: Readonly<Record<LegacySectionKey, SundaySectionKey>> = {
  golf: 'golf',
  tracer: 'discGolf',
};

function section(key: SundaySectionKey, stories: readonly StoryView[]): SectionView {
  return { key, heading: SECTION_HEADINGS[key], anchor: SECTION_ANCHORS[key], stories };
}

function numbered<T>(groups: readonly (readonly T[])[]): readonly (readonly [T, string])[][] {
  let count = 0;
  return groups.map((items) => items.map((item): readonly [T, string] => {
    count += 1;
    return [item, `story-${count}`];
  }));
}

function currentView(issue: CurrentIssue): IssueView {
  const anchored = numbered(issue.sections.map((part) => part.items));
  return {
    editorsNote: issue.editorsNote,
    sections: issue.sections.map((part, at) =>
      section(part.key, (anchored[at] ?? []).map(([story, anchor]) => ({
        anchor,
        headline: story.headline,
        body: story.body,
        whyItMatters: story.whyItMatters,
        published: displayDate(story.published),
        sourceLabel: story.sourceLabel,
        sourceUrl: story.sourceUrl,
        preview: story.preview,
      }))),
    ),
  };
}

function legacyView(issue: LegacyIssue): IssueView {
  const anchored = numbered(issue.sections.map((part) => part.items));
  return {
    editorsNote: null,
    sections: issue.sections.map((part, at) =>
      section(LEGACY_KEYS[part.key], (anchored[at] ?? []).map(([item, anchor]) => ({
        anchor,
        headline: item.headline,
        body: item.body,
        whyItMatters: null,
        published: null,
        sourceLabel: item.sourceLabel,
        sourceUrl: item.sourceUrl,
        preview: null,
      }))),
    ),
  };
}

export function issueView(issue: SundayIssue): IssueView {
  switch (issue.format) {
    case 2:
      return currentView(issue);
    case 1:
      return legacyView(issue);
    default: {
      const unhandled: never = issue;
      throw new Error(`Unhandled issue format: ${JSON.stringify(unhandled)}`);
    }
  }
}
