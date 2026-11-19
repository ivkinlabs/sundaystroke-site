import { describe, expect, it } from 'vitest';
import { displaySunday, madridDay, madridMidnight, sundayBefore, sundayOnOrAfter } from './calendar.ts';

describe('calendar', () => {
  it('reads the day and hour in Madrid, not UTC', () => {
    expect(madridDay(new Date('2026-11-07T23:30:00Z'))).toEqual({ date: '2026-11-08', weekday: 0, hour: 0 });
  });

  it('finds the coming and the previous Sunday', () => {
    expect(sundayOnOrAfter('2026-11-13')).toBe('2026-11-15');
    expect(sundayOnOrAfter('2026-11-15')).toBe('2026-11-15');
    expect(sundayBefore('2026-11-16')).toBe('2026-11-15');
    expect(sundayBefore('2026-11-15')).toBe('2026-11-08');
  });

  it('writes the issue date the way issue 1 does', () => {
    expect(displaySunday('2026-11-15')).toBe('Sunday 15 November 2026');
    expect(() => displaySunday('2026-11-14')).toThrow();
  });

  it('finds Madrid midnight across the summer-time change', () => {
    expect(madridMidnight('2026-11-08').toISOString()).toBe('2026-11-07T23:00:00.000Z');
    expect(madridMidnight('2026-07-05').toISOString()).toBe('2026-07-04T22:00:00.000Z');
  });
});
