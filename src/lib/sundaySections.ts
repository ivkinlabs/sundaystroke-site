import type { LegacySectionKey, SectionFacts, SundaySectionKey } from '../types/sunday.ts';

export const SECTIONS: Readonly<Record<SundaySectionKey, SectionFacts>> = {
  golf: { heading: 'Golf', anchor: 'section-golf' },
  discGolf: { heading: 'Disc golf', anchor: 'section-disc-golf' },
};

export const SECTION_ORDER: readonly SundaySectionKey[] = ['golf', 'discGolf'];

const LEGACY_SECTIONS: Readonly<Record<LegacySectionKey, SundaySectionKey>> = {
  golf: 'golf',
  tracer: 'discGolf',
};

export function isSectionKey(value: unknown): value is SundaySectionKey {
  return SECTION_ORDER.some((key) => key === value);
}

export function isLegacySectionKey(value: unknown): value is LegacySectionKey {
  return typeof value === 'string' && Object.hasOwn(LEGACY_SECTIONS, value);
}

export function currentSectionKey(key: SundaySectionKey | LegacySectionKey): SundaySectionKey {
  return isSectionKey(key) ? key : LEGACY_SECTIONS[key];
}
