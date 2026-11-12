import type { AgeGroup, Category, Profile, Question, T3 } from '../lib/types';
import { ageGroupOf } from '../lib/types';
import { clamp, shuffle, type Rng } from '../lib/util';
import { BANK } from './bank';
import { generate } from './generators';

/** Yaş qrupuna görə baza çətinliyi: 3–5 → 1, 6–8 → 2, 9–12 → 3, 13–15 → 4 */
export const BASE_DIFF: Record<AgeGroup, number> = { a: 1, b: 2, c: 3, d: 4 };

export interface PickOpts {
  profile: Pick<Profile, 'age' | 'seen'>;
  cats: Category[];
  n: number;
  /** 1..5; verilməsə yaşa görə */
  d?: number;
  rng: Rng;
  /** avtomatik suallar üçün pay (0..1) */
  genShare?: number;
  exclude?: Set<string>;
  /** əlavə süzgəc (məsələn, yalnız kosmos mövzusu) */
  filter?: (q: Question) => boolean;
}

/**
 * Yaşa uyğun sualları seçir:
 *  • yalnız uşağın yaş qrupuna aid suallar;
 *  • çətinlik hədəfə yaxın (±1);
 *  • ən az və ən çoxdan görülən suallar birinci (eyni sual tez təkrarlanmır).
 */
export function pickQuestions(o: PickOpts): Question[] {
  const g = ageGroupOf(o.profile.age);
  const target = clamp(o.d ?? BASE_DIFF[g], 1, 5);
  const used = o.exclude ?? new Set<string>();
  const out: Question[] = [];
  const genCats = o.cats.filter((c) => c === 'math' || c === 'time' || c === 'logic');
  const nGen = genCats.length ? Math.round(o.n * (o.genShare ?? (o.cats.length === 1 && o.cats[0] === 'math' ? 0.6 : 0.3))) : 0;

  const fits = (q: Question, spread: number) => (!o.filter || o.filter(q)) && o.cats.includes(q.cat) && q.ages.includes(g) && Math.abs(q.d - target) <= spread && !used.has(q.id);
  let pool = BANK.filter((q) => fits(q, 1));
  if (pool.length < o.n - nGen) pool = BANK.filter((q) => fits(q, 2));
  if (pool.length < o.n - nGen) pool = BANK.filter((q) => (!o.filter || o.filter(q)) && o.cats.includes(q.cat) && q.ages.includes(g) && !used.has(q.id));
  if (pool.length < o.n - nGen) pool = BANK.filter((q) => o.cats.includes(q.cat) && q.ages.includes(g) && !used.has(q.id));
  // təsadüfi qarışdır, sonra görülməmişləri önə çək
  const ranked = shuffle(o.rng, pool).sort((a, b) => (o.profile.seen[a.id] ?? 0) - (o.profile.seen[b.id] ?? 0));
  for (const q of ranked) {
    if (out.length >= o.n - nGen) break;
    out.push(q);
    used.add(q.id);
  }
  let guard = 0;
  while (out.length < o.n && genCats.length && guard++ < 50) {
    const q = generate(genCats[out.length % genCats.length], o.rng, target, g);
    if (q && !out.some((x) => x.q.en === q.q.en)) out.push(q);
  }
  return shuffle(o.rng, out);
}

/** Variantları qarışdırılmış sual (göstərmək üçün) */
export interface Prepared {
  q: Question;
  options: T3[];
  correct: number;
}

export function prepare(q: Question, rng: Rng, maxOptions = 4): Prepared {
  const idx = q.o.map((_, i) => i).filter((i) => i !== q.a);
  const chosen = [q.a, ...shuffle(rng, idx).slice(0, Math.max(1, maxOptions - 1))];
  const order = shuffle(rng, chosen);
  return { q, options: order.map((i) => q.o[i]), correct: order.indexOf(q.a) };
}

/** «Doğru / yanlış» variantı: sual + təklif olunan cavab */
export function toTrueFalse(q: Question, rng: Rng): { q: Question; claim: T3; truth: boolean } {
  const truth = rng() < 0.5 || q.o.length < 2;
  const others = q.o.filter((_, i) => i !== q.a);
  const claim = truth ? q.o[q.a] : others[Math.floor(rng() * others.length)];
  return { q, claim, truth };
}

/** Yaş qrupuna görə variant sayı: kiçiklərə 3, böyüklərə 4 */
export const optionCount = (age: number) => (ageGroupOf(age) === 'a' ? 3 : 4);
