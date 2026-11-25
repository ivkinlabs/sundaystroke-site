export const PROMOTION: RegExp = /\b(?:apps?|app\s*store|google\s*play|play\s*store|downloads?|downloaded|downloading|tracer|golf\s*gps|iphone|android)\b/i;

const STORE_LINK: RegExp = /href="[^"]*(?:apps\.apple\.com|itunes\.apple\.com|play\.google\.com)/i;
const PREVIEW_CARD: RegExp = /<a\b[^>]*\bdata-source-preview\b[\s\S]*?<\/a>/g;
const CODE: RegExp = /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g;

function articleOf(html: string): string | null {
  const start = html.indexOf('<article');
  const end = html.lastIndexOf('</article>');
  return start < 0 || end < start ? null : html.slice(start, end);
}

function ownText(article: string): string {
  return article.replace(CODE, ' ').replace(PREVIEW_CARD, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

export function sundayPageProblems(html: string): readonly string[] {
  const article = articleOf(html);
  if (article === null) return ['has no article'];
  const problems: string[] = [];
  if (STORE_LINK.test(article)) problems.push('links to an app store');
  if (/<video\b/i.test(article)) problems.push('shows a video clip');
  const promoted = PROMOTION.exec(ownText(article));
  if (promoted !== null) problems.push(`names "${promoted[0]}"`);
  return problems;
}
