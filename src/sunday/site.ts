import { SITE_ORIGIN } from './sources.ts';

const USER_AGENT: string = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const FETCH_TIMEOUT_MS: number = 20_000;
const ATTEMPTS: number = 3;
const RETRY_MS: number = 10_000;
const POLL_MS: number = 20_000;
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

export function bust(url: string): string {
  return `${url}?fresh=${Date.now()}`;
}

export function issueUrl(issueDate: string): string {
  return `${SITE_ORIGIN}/sunday/${issueDate}/`;
}

export async function issueLive(issueDate: string): Promise<boolean> {
  const status = await pageStatus(bust(issueUrl(issueDate)));
  if (status === 200) return true;
  if (status === 404) return false;
  throw new Error(`${issueUrl(issueDate)} answered ${status}; can't tell whether the issue is live`);
}

export async function inSitemap(issueDate: string): Promise<boolean> {
  return (await fetchText(bust(`${SITE_ORIGIN}/sitemap.xml`))).includes(`<loc>${issueUrl(issueDate)}</loc>`);
}

export async function waitFor(label: string, timeoutMs: number, probe: () => Promise<boolean>): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      if (await probe()) return;
    } catch (error) {
      console.log(`still waiting for ${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await pause(POLL_MS);
  }
}
