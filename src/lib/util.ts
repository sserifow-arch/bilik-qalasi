export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const ri = (r: Rng, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
export const pick = <T,>(r: Rng, a: readonly T[]): T => a[Math.floor(r() * a.length)];
export function shuffle<T>(r: Rng, a: readonly T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
export const sample = <T,>(r: Rng, a: readonly T[], n: number) => shuffle(r, a).slice(0, n);
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Yaxın, fərqli ədədlər (variantlar üçün) */
export function nearNumbers(r: Rng, ans: number, k: number, spread: number, min = 0): number[] {
  const s = new Set([ans]);
  let g = 0;
  while (s.size < k && g++ < 300) {
    const v = ans + ri(r, -spread, spread);
    if (v >= min) s.add(v);
  }
  let v = ans + 1;
  while (s.size < k) s.add(v++);
  return [...s];
}

const pad = (n: number) => String(n).padStart(2, '0');
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + n));
}
export function weekStart(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
export const weekKey = (d = new Date()) => dateKey(weekStart(d));
export function weekLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const a = new Date(y, m - 1, d);
  const b = new Date(y, m - 1, d + 6);
  return `${pad(a.getDate())}.${pad(a.getMonth() + 1)} – ${pad(b.getDate())}.${pad(b.getMonth() + 1)}.${b.getFullYear()}`;
}
export function msToWeekEnd(now = Date.now()): number {
  const e = weekStart(new Date(now));
  e.setDate(e.getDate() + 7);
  return Math.max(0, e.getTime() - now);
}

/** Sadə PIN həşi (cihazda saxlanır, açıq mətn deyil) */
export const pinHash = (pin: string) => 'p' + hashStr('brainy-kids|' + pin).toString(36);
