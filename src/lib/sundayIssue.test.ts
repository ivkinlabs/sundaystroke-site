import { describe, expect, it } from 'vitest';
import { parseCurrentIssue, parseIssue } from './sundayIssue.ts';
import { ISSUE_TWO } from '../../sunday/testIssue.ts';

function withStory(changes: Readonly<Record<string, unknown>>): string {
  const [golf, ...rest] = ISSUE_TWO.sections;
  if (golf === undefined) throw new Error('fixture golf section missing');
  const [story, ...others] = golf.items;
  if (story === undefined) throw new Error('fixture golf story missing');
  return JSON.stringify({ ...ISSUE_TWO, sections: [{ ...golf, items: [{ ...story, ...changes }, ...others] }, ...rest] });
}

describe('parseIssue', () => {
  it('reads a current issue as it was written', () => {
    expect(parseCurrentIssue(JSON.stringify(ISSUE_TWO), 'issue.json')).toEqual(ISSUE_TWO);
  });

  it('says where a current issue is wrong, so the run can fix it', () => {
    const { whyItMatters: _dropped, ...story } = JSON.parse(withStory({})).sections[0].items[0];
    const missing = JSON.stringify({ ...ISSUE_TWO, sections: [{ key: 'golf', items: [story] }] });
    expect(() => parseIssue(missing, 'issue.json')).toThrow('issue.json is not a Sunday issue: sections[0].items[0]: missing whyItMatters');
    expect(() => parseIssue(withStory({ extra: 1 }), 'issue.json')).toThrow('sections[0].items[0]: unexpected extra');
    expect(() => parseIssue(withStory({ preview: { title: 'T', siteName: 'S', description: 'D', image: 3 } }), 'issue.json')).toThrow('sections[0].items[0].preview.image');
    expect(() => parseIssue(JSON.stringify({ ...ISSUE_TWO, number: '3' }), 'issue.json')).toThrow('issue.number: must be a number');
    expect(() => parseIssue(JSON.stringify({ ...ISSUE_TWO, format: 3 }), 'issue.json')).toThrow('format must be 2');
  });

  it('refuses a file that is neither format', () => {
    expect(() => parseIssue('{"slug":"2026-11-29"}', 'issue.json')).toThrow('has no format and is not an earlier issue');
  });
});
