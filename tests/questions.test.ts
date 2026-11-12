import { describe, expect, it } from 'vitest';
import { BANK } from '../src/engine/bank';
import { AGE_GROUPS, CATEGORIES, LANGS } from '../src/lib/types';

describe('sual bazası', () => {
  it('ən azı 300 real sual var', () => {
    expect(BANK.length).toBeGreaterThanOrEqual(300);
  });
  it('id-lər unikaldır', () => {
    expect(new Set(BANK.map((q) => q.id)).size).toBe(BANK.length);
  });
  it('hər sual 3 dildə tamdır və düzgün qurulub', () => {
    for (const q of BANK) {
      expect(CATEGORIES).toContain(q.cat);
      expect(q.d >= 1 && q.d <= 5).toBe(true);
      expect(q.ages.length > 0 && q.ages.every((a) => AGE_GROUPS.includes(a))).toBe(true);
      expect(q.a >= 0 && q.a < q.o.length).toBe(true);
      expect(q.pts).toBe(q.d * 10);
      for (const l of LANGS) {
        expect(q.q[l].trim().length > 0).toBe(true);
        expect(q.e[l].trim().length > 0).toBe(true);
        const opts = q.o.map((o) => o[l]);
        expect(opts.every((o) => o.trim().length > 0)).toBe(true);
        expect(new Set(opts).size).toBe(opts.length);
      }
    }
  });
  it('hər yaş qrupu üçün kifayət qədər sual var', () => {
    for (const g of AGE_GROUPS) expect(BANK.filter((q) => q.ages.includes(g)).length).toBeGreaterThanOrEqual(80);
  });
  it('bütün kateqoriyalar doludur', () => {
    for (const c of CATEGORIES) expect(BANK.filter((q) => q.cat === c).length).toBeGreaterThanOrEqual(20);
  });
});
