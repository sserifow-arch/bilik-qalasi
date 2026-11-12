import { describe, expect, it } from 'vitest';
import { STR } from '../src/i18n/strings';
import { LANGS } from '../src/lib/types';
import { ACHIEVEMENTS } from '../src/lib/progress';
import { WORLDS, stagesOf, stageOpen, worldOpen, LOGIC_GAMES, PUZZLE_GAMES } from '../src/data/worlds';
import { pickQuestions } from '../src/engine/select';
import { mulberry32 } from '../src/lib/util';

describe('tərcümələr', () => {
  it('bütün mətnlər 3 dildə var', () => {
    for (const [k, v] of Object.entries(STR)) for (const l of LANGS) expect((v as any)[l]?.trim().length > 0, `${k}.${l}`).toBe(true);
  });
  it('hər nailiyyətin və oyunun adı var', () => {
    for (const a of ACHIEVEMENTS) expect((STR as any)['a_' + a.id]).toBeTruthy();
    for (const g of [...LOGIC_GAMES, ...PUZZLE_GAMES]) expect((STR as any)['g_' + g]).toBeTruthy();
  });
});

describe('macəra xəritəsi', () => {
  it('8 dünya, hər birində 8 mərhələ + final', () => {
    expect(WORLDS.length).toBe(8);
    for (const w of WORLDS) {
      const s = stagesOf(w);
      expect(s.length).toBe(9);
      expect(s[8].kind).toBe('boss');
    }
  });
  it('mərhələ əvvəlki keçilmədən açılmır', () => {
    const list = stagesOf(WORLDS[0]);
    expect(stageOpen({}, list, 0)).toBe(true);
    expect(stageOpen({}, list, 1)).toBe(false);
    expect(stageOpen({ [list[0].id]: 1 }, list, 1)).toBe(true);
    expect(worldOpen({}, 1)).toBe(false);
    const three = Object.fromEntries(list.slice(0, 3).map((s) => [s.id, 2]));
    expect(worldOpen(three, 1)).toBe(true);
  });
  it('hər dünyanın hər yaş üçün sualı var', () => {
    for (const w of WORLDS)
      for (const age of [4, 7, 11, 14]) {
        const qs = pickQuestions({ profile: { age, seen: {} }, cats: w.cats, filter: w.filter, n: 10, rng: mulberry32(age) });
        expect(qs.length, `${w.id}/${age}`).toBeGreaterThanOrEqual(5);
      }
  });
});
