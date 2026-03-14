import { BadRequestException } from '@nestjs/common';

export function dedupe<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function buildBirthDateBounds(minAge?: number, maxAge?: number) {
  if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
    throw new BadRequestException('minAge cannot be greater than maxAge');
  }

  if (minAge === undefined && maxAge === undefined) {
    return { birthDateMin: undefined, birthDateMax: undefined };
  }

  const today = startOfDay(new Date());

  // Inclusive bounds for age range.
  const birthDateMax = minAge !== undefined ? endOfDay(subYears(today, minAge)) : undefined;
  const birthDateMin =
    maxAge !== undefined ? startOfDay(addDays(subYears(today, maxAge + 1), 1)) : undefined;

  return { birthDateMin, birthDateMax };
}

export function calculateAge(birthDate?: Date | null): number | undefined {
  if (!birthDate) return undefined;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

function subYears(date: Date, years: number) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() - years);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
