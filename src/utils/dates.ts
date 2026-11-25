const MONTHS: readonly string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DISPLAY_DATE: RegExp = /(\d{1,2}) ([A-Z][a-z]+) (\d{4})/;

export function isoDate(display: string): string {
  const match = DISPLAY_DATE.exec(display);
  if (match === null) throw new Error(`Not a "d Month yyyy" date: ${display}`);
  const [, day, monthName, year] = match;
  const month = MONTHS.indexOf(monthName ?? '');
  if (day === undefined || year === undefined || month === -1) throw new Error(`Unknown month in date: ${display}`);
  return `${year}-${String(month + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function displayDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const month = match === null ? undefined : MONTHS[Number(match[2]) - 1];
  if (match === null || month === undefined) throw new Error(`Not a yyyy-mm-dd date: ${iso}`);
  return `${Number(match[3])} ${month} ${match[1]}`;
}
