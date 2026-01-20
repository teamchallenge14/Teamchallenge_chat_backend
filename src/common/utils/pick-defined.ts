function pickDefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function hasAny(values: unknown[]): boolean {
  return values.some((v) => v !== undefined);
}

export { pickDefined, hasAny };
