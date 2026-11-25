import { currentSectionKey, SECTIONS } from './sundaySections.ts';
import { displayDate } from '../utils/dates.ts';
import type { IssueView, LegacyItem, LegacySectionKey, SectionView, StoryView, SundayIssue, SundaySectionKey, SundayStory } from '../types/sunday.ts';

type StoryFields = Omit<StoryView, 'anchor'>;

interface SectionSource<T> {
  key: SundaySectionKey | LegacySectionKey;
  items: readonly T[];
}

function currentStory(story: SundayStory): StoryFields {
  return {
    headline: story.headline,
    body: story.body,
    whyItMatters: story.whyItMatters,
    published: { iso: story.published, label: displayDate(story.published) },
    sourceLabel: story.sourceLabel,
    sourceUrl: story.sourceUrl,
    preview: story.preview,
  };
}

function legacyStory(item: LegacyItem): StoryFields {
  return { headline: item.headline, body: item.body, whyItMatters: null, published: null, sourceLabel: item.sourceLabel, sourceUrl: item.sourceUrl, preview: null };
}

function sectionViews<T>(sections: readonly SectionSource<T>[], toStory: (item: T) => StoryFields): readonly SectionView[] {
  let count = 0;
  return sections.map((part) => {
    const key = currentSectionKey(part.key);
    const stories = part.items.map((item): StoryView => {
      count += 1;
      return { anchor: `story-${count}`, ...toStory(item) };
    });
    return { key, ...SECTIONS[key], stories };
  });
}

export function issueView(issue: SundayIssue): IssueView {
  switch (issue.format) {
    case 2:
      return { editorsNote: issue.editorsNote, sections: sectionViews(issue.sections, currentStory) };
    case 1:
      return { editorsNote: null, sections: sectionViews(issue.sections, legacyStory) };
    default: {
      const unhandled: never = issue;
      throw new Error(`Unhandled issue format: ${JSON.stringify(unhandled)}`);
    }
  }
}
