export interface PromotionRule {
  pattern: RegExp;
  reason: string;
}

export const PROMOTION_RULES: readonly PromotionRule[] = [
  { pattern: /\b(?:Tracer|Golf\s*GPS|GolfGPS|apps?)\b/i, reason: 'names an app' },
  { pattern: /\b(?:App\s*Store|Google\s*Play|Play\s*Store)\b/i, reason: 'names an app store' },
  { pattern: /\bdownload/i, reason: 'asks for a download' },
];

export const STORE_LINK: RegExp = /^https?:\/\/(?:[a-z0-9-]+\.)*(?:apps\.apple\.com|itunes\.apple\.com|play\.google\.com)\//i;

export function promotionReasons(text: string): readonly string[] {
  return PROMOTION_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.reason);
}
