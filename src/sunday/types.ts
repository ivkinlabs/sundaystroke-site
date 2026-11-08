import type { SundaySectionKey } from '../types/sunday.ts';

export interface FeedSource {
  name: string;
  feedUrl: string;
  section: SundaySectionKey;
}

export interface FeedEntry {
  title: string;
  link: string;
  published: string;
  excerpt: string;
}

export interface Candidate extends FeedEntry {
  sourceName: string;
  section: SundaySectionKey;
}

export interface FeedFailure {
  sourceName: string;
  reason: string;
}

export interface CandidateFile {
  issueDate: string;
  collectedAt: string;
  since: string;
  candidates: readonly Candidate[];
  failures: readonly FeedFailure[];
}

export type VerdictKind = 'confirmed' | 'rejected';

export interface ItemVerdict {
  sourceUrl: string;
  verdict: VerdictKind;
  reason: string;
}

export interface VerdictFile {
  issueDate: string;
  verdicts: readonly ItemVerdict[];
}

export interface MadridDay {
  date: string;
  weekday: number;
  hour: number;
}

export type Step = 'find' | 'write' | 'check' | 'open-pr' | 'publish' | 'alert-missed' | 'report';

export interface PlanFacts {
  today: MadridDay;
  issueLive: boolean;
  candidatesCollectedOn: string | null;
  pullOpen: boolean;
  missedAlerted: boolean;
  publishedIssues: number;
  reportSent: boolean;
}

export interface Plan {
  issueDate: string;
  steps: readonly Step[];
}
