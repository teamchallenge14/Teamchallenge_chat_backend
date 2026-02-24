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

  const today = new Date();

  const birthDateMax = minAge !== undefined ? subYears(today, minAge) : undefined;
  const birthDateMin = maxAge !== undefined ? addDays(subYears(today, maxAge + 1), 1) : undefined;

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
