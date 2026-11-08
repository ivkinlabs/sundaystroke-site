export type Fields = Readonly<Record<string, unknown>>;

export function isRecord(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasStrings(value: Fields, keys: readonly string[]): boolean {
  return keys.every((key) => typeof value[key] === 'string');
}

export function hasExactKeys(value: Fields, keys: readonly string[]): boolean {
  const present = Object.keys(value);
  return present.length === keys.length && keys.every((key) => present.includes(key));
}
