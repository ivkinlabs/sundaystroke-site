import { execFileSync } from 'node:child_process';
import { FACTORY_APP, FACTORY_RUNTIME } from './sources.ts';

export const COMMAND_TIMEOUT_MS: number = 5 * 60_000;

export function run(command: string, args: readonly string[], timeoutMs: number, input?: string, cwd?: string): string {
  return execFileSync(command, [...args], { encoding: 'utf8', timeout: timeoutMs, input, cwd, maxBuffer: 64 * 1024 * 1024 }).trim();
}

export function git(args: readonly string[]): string {
  return run('git', args, COMMAND_TIMEOUT_MS);
}

export function gh(args: readonly string[]): string {
  return run('gh', args, COMMAND_TIMEOUT_MS);
}

export function notify(text: string, digest: boolean): void {
  run('uv', ['run', '--frozen', '--project', FACTORY_RUNTIME, 'factory', 'notify', FACTORY_APP, text, ...(digest ? ['--digest'] : [])], COMMAND_TIMEOUT_MS);
}
