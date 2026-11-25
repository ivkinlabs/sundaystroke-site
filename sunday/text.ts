const ABBREVIATIONS: RegExp = /\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|No|U\.S|U\.K|a\.m|p\.m|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|[A-Z])\./g;
const SENTENCE_END: RegExp = /[.!?…]+["”’)]*(?=\s|$)/g;

export function sentenceCount(text: string): number {
  return (text.replace(ABBREVIATIONS, 'ABBR').trim().match(SENTENCE_END) ?? []).length;
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

function plainWords(text: string): readonly string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/[’']/g, '')
    .replace(/(\p{N})[.,](?=\p{N})/gu, '$1')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word !== '');
}

export function longestSharedRun(ours: string, theirs: string): number {
  const a = plainWords(ours);
  const b = plainWords(theirs);
  let best = 0;
  let previous: number[] = new Array<number>(b.length + 1).fill(0);
  for (const word of a) {
    const current: number[] = new Array<number>(b.length + 1).fill(0);
    b.forEach((other, at) => {
      if (word !== other) return;
      const run = (previous[at] ?? 0) + 1;
      current[at + 1] = run;
      best = Math.max(best, run);
    });
    previous = current;
  }
  return best;
}

const SIGNIFICANT_WORD_CHARS: number = 4;

function significantWords(text: string): readonly string[] {
  return plainWords(text).filter((word) => word.length >= SIGNIFICANT_WORD_CHARS);
}

export function sharesWord(ours: string, theirs: string): boolean {
  const others = significantWords(theirs);
  return significantWords(ours).some((word) => others.some((other) => word.startsWith(other) || other.startsWith(word)));
}
