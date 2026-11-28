import { describe, expect, it } from 'vitest';
import { pullBody } from './pullBody.ts';
import { ISSUE_TWO } from './testIssue.ts';
import type { CheckRecord, FactCheckFact } from './types.ts';
import { hasStrings, isRecord } from '../src/lib/guards.ts';

const record: CheckRecord = {
  issueDate: ISSUE_TWO.slug,
  issueHash: 'hash',
  checkedAt: '2026-11-15T08:40:00.000Z',
  verdicts: [
    { sourceUrl: 'https://www.bbc.co.uk/sport/golf/1', verdict: 'confirmed', reason: 'the page says 63' },
    { sourceUrl: 'https://www.pdga.com/news/1', verdict: 'confirmed', reason: 'the dates are on the page' },
  ],
};

const FACT_CHECK: RegExp = /^```factory-fact-check\n([\s\S]*?)^```$/m;

function isFact(value: unknown): value is FactCheckFact {
  return isRecord(value) && value.part === 'text' && hasStrings(value, ['claim', 'source']);
}

function facts(): readonly FactCheckFact[] {
  const block = FACT_CHECK.exec(pullBody(ISSUE_TWO, record))?.[1];
  if (block === undefined) throw new Error('no fact check block');
  const pages: unknown = JSON.parse(block);
  if (!Array.isArray(pages) || pages.length !== 1) throw new Error('one page expected');
  const page: unknown = pages[0];
  if (!isRecord(page) || page.page !== 'src/data/sunday/2026-11-15.json' || !Array.isArray(page.facts)) throw new Error('the issue file page expected');
  return page.facts.filter(isFact);
}

describe('pullBody', () => {
  it('fact checks the lead, every card, the quick hits, the This week box and the Sunday round tip, each sourced', () => {
    const lead = ISSUE_TWO.lead;
    const tip = ISSUE_TWO.sundayRound;
    const event = ISSUE_TWO.thisWeek?.[0];
    if (lead === null || tip === null || event === undefined) throw new Error('fixture blocks missing');
    expect(facts().map((fact) => fact.source)).toEqual([
      lead.sourceUrl,
      ...ISSUE_TWO.sections.flatMap((section) => section.items.map((item) => item.sourceUrl)),
      ...ISSUE_TWO.quickHits.map((hit) => hit.sourceUrl),
      event.sourceUrl,
      tip.sourceUrl,
    ]);
    expect(facts()[0]?.claim).toBe(`${lead.headline}: ${lead.body} ${lead.whyItMatters ?? ''}`);
    expect(facts().map((fact) => fact.claim)).toContain('The Island Championship, 19–22 November, Port Royal, Bermuda. The last full-field event of the year decides who keeps a card for next season.');
    expect(facts().map((fact) => fact.claim)).toContain(ISSUE_TWO.quickHits[0]?.text);
  });

  it('shows the lead, the editor\'s note and the This week box the owner approves', () => {
    const body = pullBody(ISSUE_TWO, record);
    expect(body).toContain('## Lead story\n**Jones waits out the wind** (Sky Sports)');
    expect(body).toContain(`## Editor's note\n${ISSUE_TWO.editorNote ?? ''}`);
    expect(body).toContain('## This week\n- The Island Championship, 19–22 November');
    expect(pullBody({ ...ISSUE_TWO, thisWeek: [] }, record)).toContain('## This week\nNo tour event this week.');
  });

  it('says the issue goes live only once the owner approves it', () => {
    expect(pullBody(ISSUE_TWO, record)).toContain('Goes live once the owner taps Publish on this exact issue.');
    expect(pullBody(ISSUE_TWO, record)).not.toContain('Merged on Sunday morning');
  });
});
