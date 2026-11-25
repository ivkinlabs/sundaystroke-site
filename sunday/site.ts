import { SITE_ORIGIN } from './sources.ts';

const USER_AGENT: string = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const FETCH_TIMEOUT_MS: number = 20_000;
const ATTEMPTS: number = 3;
const RETRY_MS: number = 10_000;
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

export interface FetchedPage {
  html: string;
  url: string;
}

export async function sourcePage(url: string): Promise<FetchedPage | null> {
  const response = await retried(url);
  if (response.status === 429 || response.status >= 500) {
    await response.body?.cancel();
    throw new Error(`${url} answered ${response.status}; run the step again later`);
  }
  if (!response.ok) {
    await response.body?.cancel();
    return null;
  }
  return { html: await response.text(), url: response.url === '' ? url : response.url };
}
