import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { STORE_LINK, promotionReasons } from '../sunday/promotion.ts';

const DIST = 'dist';
const SITE_HOST = 'sundaystroke.com';
const FROZEN_PAGES = ['privacy', 'terms', 'support', 'community', 'manual-tracing'];
const OUR_APP_IDS = ['6821717424', '6762449303'];
const PRODUCT_PREFIXES = ['index.html', 'tracer/', 'golf-gps/'];
const COPY_RULES = [
  { name: 'baseball', pattern: /baseball/i },
  { name: '"shot" followed by "tracer"', pattern: /shot\s*tracer/i },
];
const CURRENCY = /[$€£¥]\s?\d|\d\s?(?:USD|EUR|GBP)\b/;
const CHECKED_ON = /Checked on \d{1,2} [A-Z][a-z]+ \d{4}/;
const NEWS_PREFIX = 'sunday/';
const ARTICLE = /<article\b[^>]*>([\s\S]*?)<\/article>/;
const TRACER_DISTANCE = /\b(?:measures?|calculates?|tracks?)\b[^.]{0,40}\bdistance/i;

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

function visibleText(html) {
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

function metaContent(html, attribute, name) {
  const tag = html.match(new RegExp(`<meta[^>]+${attribute}="${name}"[^>]*>`));
  if (tag === null) return null;
  const content = tag[0].match(/content="([^"]*)"/);
  return content === null ? null : content[1];
}

function headProblems(page, html, frozen) {
  const found = [];
  const title = html.match(/<title>([^<]*)<\/title>/);
  if (title === null || title[1].trim() === '') found.push(`${page}: no title`);
  const description = metaContent(html, 'name', 'description');
  if (description === null || description.trim() === '') found.push(`${page}: no meta description`);
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
  if (canonical === null || !canonical[1].startsWith(`https://${SITE_HOST}/`)) found.push(`${page}: no canonical on https://${SITE_HOST}`);
  if (frozen) return found;
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length === 0) found.push(`${page}: no JSON-LD`);
  for (const [, json] of blocks) {
    try {
      const data = JSON.parse(json);
      if (data['@context'] !== 'https://schema.org') found.push(`${page}: JSON-LD without the schema.org context`);
      if (/aggregateRating|reviewCount|ratingValue/.test(json)) found.push(`${page}: JSON-LD claims a rating`);
    } catch {
      found.push(`${page}: JSON-LD does not parse`);
    }
  }
  const image = metaContent(html, 'property', 'og:image');
  if (image === null || !image.startsWith(`https://${SITE_HOST}/`)) found.push(`${page}: no absolute og:image`);
  else if (!resolveInternal(new URL(image).pathname)) found.push(`${page}: og:image is missing ${image}`);
  if (metaContent(html, 'name', 'twitter:card') === null) found.push(`${page}: no Twitter card`);
  for (const [, attributes] of html.matchAll(/<time([^>]*)>/g)) {
    if (!/datetime="\d{4}-\d{2}-\d{2}"/.test(attributes)) found.push(`${page}: a date without a machine-readable datetime`);
  }
  return found;
}

function newsProblems(page, html) {
  const article = html.match(ARTICLE);
  if (article === null) return [`${page}: no article`];
  const found = promotionReasons(visibleText(article[1]).replace(/&nbsp;|&#160;/g, ' ')).map((reason) => `${page}: the article ${reason}`);
  for (const [, href] of article[1].matchAll(/href="([^"]+)"/g)) {
    if (STORE_LINK.test(href)) found.push(`${page}: the article links a store, ${href}`);
  }
  if (/<video\b/i.test(article[1])) found.push(`${page}: the article plays a video`);
  return found;
}

function resolveInternal(href) {
  const path = href.split(/[?#]/)[0];
  if (path === '') return true;
  const target = join(DIST, decodeURIComponent(path));
  if (path.endsWith('/')) return existsSync(join(target, 'index.html'));
  return existsSync(target) || existsSync(`${target}.html`);
}

const problems = [];
const files = htmlFiles(DIST).filter((file) => !file.endsWith('404.html') && !file.endsWith('faq.html'));

for (const file of files) {
  const page = relative(DIST, file);
  const html = readFileSync(file, 'utf8');
  const text = visibleText(html);
  const frozen = FROZEN_PAGES.some((name) => page === `${name}.html`);

  problems.push(...headProblems(page, html, frozen));

  for (const rule of COPY_RULES) {
    if (rule.pattern.test(html)) problems.push(`${page}: contains ${rule.name}`);
  }
  if (PRODUCT_PREFIXES.some((prefix) => page === prefix || page.startsWith(prefix)) && CURRENCY.test(text)) {
    problems.push(`${page}: shows a currency amount`);
  }
  if (page.startsWith(NEWS_PREFIX)) problems.push(...newsProblems(page, html));
  if (page.startsWith('tracer/') && TRACER_DISTANCE.test(text)) problems.push(`${page}: says Tracer measures distance`);
  if (page.startsWith('compare/') && !CHECKED_ON.test(text)) problems.push(`${page}: no "Checked on" date`);
  if (!html.includes('static.cloudflareinsights.com/beacon.min.js') || !html.includes('data-cf-beacon')) problems.push(`${page}: no analytics beacon`);
  if (!html.includes('name="google-site-verification"')) problems.push(`${page}: no verification meta`);

  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    const ourStoreLink = href.includes('apps.apple.com') && OUR_APP_IDS.some((id) => href.includes(`id${id}`));
    if (ourStoreLink && (!/[?&]ct=web-[a-z-]+/.test(href) || !href.includes('mt=8'))) {
      problems.push(`${page}: untagged App Store link ${href}`);
    }
    if (href.startsWith('/') && !href.startsWith('//') && !resolveInternal(href)) problems.push(`${page}: broken link ${href}`);
    if (href.startsWith(`https://${SITE_HOST}/`) && !resolveInternal(new URL(href).pathname)) problems.push(`${page}: broken link ${href}`);
  }
  for (const [, src] of html.matchAll(/<(?:source|img)[^>]+src="(\/[^"]+)"/g)) {
    if (!resolveInternal(src)) problems.push(`${page}: missing media ${src}`);
  }
}

for (const page of FROZEN_PAGES) {
  if (!existsSync(join(DIST, `${page}.html`))) problems.push(`frozen page /${page} is not served at its exact URL`);
}

const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  if (!resolveInternal(new URL(loc).pathname)) problems.push(`sitemap lists a missing page ${loc}`);
}
const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc).pathname));
for (const file of files) {
  const page = `/${relative(DIST, file)}`.replace(/index\.html$/, '').replace(/\.html$/, '');
  if (!listed.has(page)) problems.push(`sitemap does not list ${page}`);
}
if (!readFileSync(join(DIST, 'robots.txt'), 'utf8').includes(`https://${SITE_HOST}/sitemap.xml`)) problems.push('robots.txt does not name the sitemap');

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`dist check passed: ${files.length} pages`);
