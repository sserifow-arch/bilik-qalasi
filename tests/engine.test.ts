import { describe, expect, it } from 'vitest';
import { pickQuestions, prepare, toTrueFalse } from '../src/engine/select';
import { genMath, genPattern, genSequence, genOdd, genTime } from '../src/engine/generators';
import { mulberry32 } from '../src/lib/util';
import { ageGroupOf, CATEGORIES } from '../src/lib/types';
import { LANGS } from '../src/lib/types';

describe('sual seçimi', () => {
  it('yalnız uşağın yaş qrupuna uyğun suallar seçilir', () => {
    for (const age of [4, 7, 11, 14]) {
      const g = ageGroupOf(age);
      const qs = pickQuestions({ profile: { age, seen: {} }, cats: ['general', 'azerbaijan'], n: 10, rng: mulberry32(age) });
      expect(qs.length).toBe(10);
      for (const q of qs) expect(q.ages).toContain(g);
    }
  });
  it('bir sessiyada sual təkrarlanmır', () => {
    const qs = pickQuestions({ profile: { age: 9, seen: {} }, cats: CATEGORIES, n: 20, rng: mulberry32(1) });
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
  });
  it('görülmüş suallar sonraya saxlanılır', () => {
    const first = pickQuestions({ profile: { age: 9, seen: {} }, cats: ['azerbaijan'], n: 8, rng: mulberry32(2) });
    const seen = Object.fromEntries(first.map((q) => [q.id, Date.now()]));
    const second = pickQuestions({ profile: { age: 9, seen }, cats: ['azerbaijan'], n: 8, rng: mulberry32(3) });
    const overlap = second.filter((q) => seen[q.id]).length;
    expect(overlap).toBe(0);
  });
  it('variantlar qarışdırılanda düzgün cavab itmir', () => {
    const r = mulberry32(5);
    const qs = pickQuestions({ profile: { age: 12, seen: {} }, cats: CATEGORIES, n: 30, rng: r });
    for (const q of qs) {
      const p = prepare(q, r, 3);
      expect(p.options[p.correct]).toEqual(q.o[q.a]);
      expect(p.options.length).toBeLessThanOrEqual(3);
    }
  });
  it('«doğru/yanlış» iddiası düzgün qiymətləndirilir', () => {
    const r = mulberry32(9);
    const [q] = pickQuestions({ profile: { age: 8, seen: {} }, cats: ['general'], n: 1, rng: r });
    for (let i = 0; i < 20; i++) {
      const tf = toTrueFalse(q, r);
      expect(tf.truth).toBe(tf.claim === q.o[q.a]);
    }
  });
});

describe('avtomatik suallar', () => {
  const gens = [genMath, genPattern, genSequence, genOdd, genTime];
  it('bütün çətinliklərdə düzgün və 3 dilli olur', () => {
    const r = mulberry32(42);
    for (const g of gens)
      for (let d = 1; d <= 5; d++)
        for (let k = 0; k < 40; k++) {
          const q = g(r, d);
          expect(q.gen).toBe(true);
          for (const l of LANGS) {
            const opts = q.o.map((o) => o[l]);
            expect(new Set(opts).size).toBe(opts.length);
            expect(q.q[l].length > 0).toBe(true);
          }
        }
  });
  it('riyazi cavablar düzdür', () => {
    const r = mulberry32(7);
    for (let k = 0; k < 200; k++) {
      const q = genMath(r, 3);
      const m = q.q.en.match(/^(\d+) ([+−×:]) (\d+) = \?$/);
      if (!m) continue;
      const a = +m[1], b = +m[3];
      const ans = m[2] === '+' ? a + b : m[2] === '−' ? a - b : m[2] === '×' ? a * b : a / b;
      expect(q.o[q.a].en).toBe(String(ans));
    }
  });
});
