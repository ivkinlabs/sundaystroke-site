import type { MadridDay } from './types.ts';

const ZONE: string = 'Europe/Madrid';
const DAY_MS: number = 86_400_000;
const WEEKDAYS: readonly string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS: readonly string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function madridDay(now: Date): MadridDay {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes): string => {
    const found = parts.find((candidate) => candidate.type === type);
    if (found === undefined) throw new Error(`No ${type} in the Madrid date`);
    return found.value;
  };
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    weekday: WEEKDAYS.indexOf(part('weekday')),
    hour: Number(part('hour')),
  };
}

function utcDay(date: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Not a yyyy-mm-dd date: ${date}`);
  return new Date(`${date}T00:00:00Z`);
}

export function addDays(date: string, days: number): string {
  return new Date(utcDay(date).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  return utcDay(date).getUTCDay();
}

export function isSunday(date: string): boolean {
  return weekdayOf(date) === 0;
}

export function sundayOnOrAfter(date: string): string {
  return addDays(date, (7 - weekdayOf(date)) % 7);
}

export function sundayBefore(date: string): string {
  return addDays(date, -(weekdayOf(date) === 0 ? 7 : weekdayOf(date)));
}

export function displaySunday(date: string): string {
  if (!isSunday(date)) throw new Error(`${date} is not a Sunday`);
  const day = utcDay(date);
  return `Sunday ${day.getUTCDate()} ${MONTHS[day.getUTCMonth()] ?? ''} ${day.getUTCFullYear()}`;
}

export function madridMidnight(date: string): Date {
  const guess = new Date(`${date}T00:00:00Z`);
  for (const offsetHours of [-1, -2, 0, -3, 1]) {
    const candidate = new Date(guess.getTime() + offsetHours * 3_600_000);
    const day = madridDay(candidate);
    if (day.date === date && day.hour === 0) return candidate;
  }
  throw new Error(`No Madrid midnight found for ${date}`);
}
