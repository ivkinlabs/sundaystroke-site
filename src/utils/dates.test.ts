import { describe, expect, it } from 'vitest';
import { displayDate, isoDate } from './dates';

describe('isoDate', () => {
  it('turns a display date into an ISO date', () => {
    expect(isoDate('29 October 2026')).toBe('2026-10-29');
    expect(isoDate('1 November 2026')).toBe('2026-11-01');
  });

  it('reads a date with a weekday in front', () => {
    expect(isoDate('Sunday 1 November 2026')).toBe('2026-11-01');
  });

  it('refuses anything else', () => {
    expect(() => isoDate('2026-10-29')).toThrow();
    expect(() => isoDate('29 Octember 2026')).toThrow();
  });
});

describe('displayDate', () => {
  it('turns an ISO date into a display date', () => {
    expect(displayDate('2026-11-05')).toBe('5 November 2026');
  });

  it('refuses days that do not exist', () => {
    expect(() => displayDate('2026-02-31')).toThrow();
    expect(() => displayDate('2026-11-99')).toThrow();
  });
});
