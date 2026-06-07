const FNV_OFFSET_BASIS = 2_166_136_261;
const FNV_PRIME = 16_777_619;

export function deterministicHash(seed: string): number {
  let hash = FNV_OFFSET_BASIS;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}

export function hashToken(seed: string, length = 8): string {
  return deterministicHash(seed).toString(36).padStart(length, "0").slice(0, length);
}

export function seededInt(seed: string, min: number, max: number): number {
  const lower = Math.ceil(min);
  const upper = Math.floor(max);

  if (upper <= lower) {
    return lower;
  }

  const range = upper - lower + 1;
  return lower + (deterministicHash(seed) % range);
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function addDaysIso(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetweenIso(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00.000Z`).getTime();
  const end = new Date(`${endIso}T00:00:00.000Z`).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function hasNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
