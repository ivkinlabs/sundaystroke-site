import { describe, expect, it } from 'vitest';
import { displayRange, isoDate } from './dates';

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

describe('displayRange', () => {
  it('reads an event\'s days the way a golfer says them', () => {
    expect(displayRange('2026-12-03', '2026-12-06')).toBe('3–6 December');
    expect(displayRange('2026-11-30', '2026-12-03')).toBe('30 November to 3 December');
    expect(displayRange('2026-12-30', '2027-01-02')).toBe('30 December 2026 to 2 January 2027');
    expect(displayRange('2026-12-05', '2026-12-05')).toBe('5 December');
  });
});
