import { SITE_ORIGIN } from './sources.ts';
import type { FetchedPage } from './types.ts';

const USER_AGENT: string = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const FETCH_TIMEOUT_MS: number = 20_000;
const ATTEMPTS: number = 3;
const RETRY_MS: number = 10_000;
const HEAD_LIMIT_BYTES: number = 512 * 1024;
export const DEAD_LINK_STATUSES: ReadonlySet<number> = new Set([404, 410]);

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function once(url: string): Promise<Response> {
  return fetch(url, { headers: { 'user-agent': USER_AGENT }, redirect: 'follow', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

async function retried(url: string): Promise<Response> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      return await once(url);
    } catch (error) {
      lastError = error;
      if (attempt < ATTEMPTS) await pause(RETRY_MS);
    }
  }
  throw new Error(`${url} could not be reached: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

export async function pageStatus(url: string): Promise<number> {
  const response = await retried(url);
  await response.body?.cancel();
  return response.status;
}

export async function fetchText(url: string): Promise<string> {
  const response = await retried(url);
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.text();
}

export async function fetchPageHead(url: string): Promise<FetchedPage> {
  const response = await retried(url);
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  if (!(response.headers.get('content-type') ?? '').includes('html')) throw new Error(`${url} is not a web page`);
  if (response.body === null) throw new Error(`${url} sent no page`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = '';
  let bytes = 0;
  while (bytes < HEAD_LIMIT_BYTES && !/<\/head>/i.test(html)) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    html += decoder.decode(chunk.value, { stream: true });
  }
  await reader.cancel();
  return { html, url: response.url === '' ? url : response.url };
}
