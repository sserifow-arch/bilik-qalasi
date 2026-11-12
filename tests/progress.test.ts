import { describe, expect, it } from 'vitest';
import { applyAward, applyStage, checkAchievements, levelOf, newProfile, recordAnswer, touchStreak, xpForLevel, freshDaily } from '../src/lib/progress';
import { migrateLegacy, normalizeData, normalizeProfile, emptyData } from '../src/lib/storage';
import { BANK } from '../src/engine/bank';

const p0 = () => newProfile('Aylin', 7, 'az', '🦁');

describe('mükafatlar', () => {
  it('eyni mükafat iki dəfə verilmir (idempotent)', () => {
    const [a, ok1] = applyAward(p0(), 'daily:2026-01-01', { coins: 30, stars: 3 });
    const [b, ok2] = applyAward(a, 'daily:2026-01-01', { coins: 30, stars: 3 });
    expect(ok1).toBe(true);
    expect(ok2).toBe(false);
    expect(b.coins).toBe(a.coins);
    expect(b.stars).toBe(a.stars);
  });
  it('mərhələ ulduzları yalnız artım qədər verilir', () => {
    let p = p0();
    let g: number;
    [p, g] = applyStage(p, 'colors:1', 2);
    expect(g).toBe(2);
    [p, g] = applyStage(p, 'colors:1', 2);
    expect(g).toBe(0);
    [p, g] = applyStage(p, 'colors:1', 1);
    expect(g).toBe(0);
    [p, g] = applyStage(p, 'colors:1', 3);
    expect(g).toBe(1);
    expect(p.stars).toBe(3);
    expect(p.stages['colors:1']).toBe(3);
  });
  it('nailiyyət bir dəfə qazanılır', () => {
    let p = { ...p0(), stats: { ...p0().stats, games: 1 } };
    const d = emptyData();
    let fresh: string[];
    [p, fresh] = checkAchievements(p, d);
    expect(fresh).toContain('first_quiz');
    [p, fresh] = checkAchievements(p, d);
    expect(fresh.length).toBe(0);
  });
});

describe('səviyyə və statistika', () => {
  it('XP-dən səviyyə hesablanır', () => {
    expect(levelOf(0).level).toBe(1);
    expect(levelOf(xpForLevel(2)).level).toBe(2);
    expect(levelOf(xpForLevel(5) - 1).level).toBe(4);
  });
  it('cavab statistikası düzgün yazılır', () => {
    const q = BANK[0];
    let p = recordAnswer(p0(), q, true, 5, '2026-03-01');
    p = recordAnswer(p, q, false, 7, '2026-03-01');
    expect(p.stats.answered).toBe(2);
    expect(p.stats.correct).toBe(1);
    expect(p.stats.byCat[q.cat]).toEqual({ n: 2, ok: 1 });
    expect(p.stats.days['2026-03-01'].sec).toBe(12);
    expect(p.seen[q.id]).toBeTruthy();
  });
  it('gündəlik seriya ardıcıl günlərdə artır, fasilədə sıfırlanır', () => {
    let p = touchStreak(p0(), '2026-03-01');
    p = touchStreak(p, '2026-03-02');
    p = touchStreak(p, '2026-03-02');
    expect(p.streak.count).toBe(2);
    p = touchStreak(p, '2026-03-05');
    expect(p.streak.count).toBe(1);
    expect(p.streak.best).toBe(2);
  });
  it('yeni gündə gündəlik tapşırıq yenilənir', () => {
    const p = { ...p0(), daily: { date: '2026-01-01', logic: 5, math: 5, general: 5, puzzle: true, claimed: true } };
    const f = freshDaily(p, '2026-01-02');
    expect(f.daily.logic).toBe(0);
    expect(f.daily.claimed).toBe(false);
  });
});

describe('yaddaş və köçürmə', () => {
  it('köhnə «Bilik Qalası» profilləri köçürülür', () => {
    const d = migrateLegacy({ profiles: [{ id: 'p1', name: 'Nigar', age: 6, avatar: '🐼', lang: 'ru', prog: { logic: [3, 2], math: [1] } }], cur: 'p1', sound: false });
    expect(d!.profiles[0].name).toBe('Nigar');
    expect(d!.profiles[0].stars).toBe(6);
    expect(d!.profiles[0].lang).toBe('ru');
    expect(d!.activeId).toBe('p1');
    expect(d!.sound).toBe(false);
  });
  it('çatışmayan sahələr əlavə olunur, mövcudlar qorunur', () => {
    const p = normalizeProfile({ id: 'x', name: 'Murad', age: 10, lang: 'en', avatar: '🦊', xp: 500 });
    expect(p.xp).toBe(500);
    expect(p.stats.byCat).toEqual({});
    expect(Array.isArray(p.achievements)).toBe(true);
    const d = normalizeData({ profiles: [p], activeId: 'missing' });
    expect(d.activeId).toBe(null);
    expect(d.version).toBe(3);
  });
});
