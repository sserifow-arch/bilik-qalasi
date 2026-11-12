import type { AppData, Lang, Profile, Question, DailyState } from './types';
import { addDays, dateKey } from './util';

export function emptyDaily(date = dateKey()): DailyState {
  return { date, logic: 0, math: 0, general: 0, puzzle: false, claimed: false };
}

export function newProfile(name: string, age: number, lang: Lang, avatar: string): Profile {
  return {
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name.normalize('NFC').trim().slice(0, 20),
    age,
    lang,
    avatar,
    createdAt: Date.now(),
    xp: 0,
    stars: 0,
    coins: 20,
    streak: { count: 0, best: 0, last: '' },
    achievements: [],
    badges: [],
    stages: {},
    seen: {},
    stats: { answered: 0, correct: 0, timeSec: 0, games: 0, byCat: {}, days: {} },
    daily: emptyDaily(),
    owned: [],
    equipped: [],
    awarded: {},
  };
}

/** Səviyyə n üçün lazım olan ümumi XP: 0, 100, 300, 600, 1000 … */
export const xpForLevel = (n: number) => 50 * n * (n - 1);
export function levelOf(xp: number) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, cur, next, progress: (xp - cur) / (next - cur) };
}

/** Gündəlik seriya: bu gün ilk fəaliyyətdə yenilənir */
export function touchStreak(p: Profile, today = dateKey()): Profile {
  if (p.streak.last === today) return p;
  const count = p.streak.last === addDays(today, -1) ? p.streak.count + 1 : 1;
  return { ...p, streak: { count, best: Math.max(p.streak.best, count), last: today } };
}

/** Cavabı qeyd edir: statistika, təkrarlanmanın qarşısı, XP və sikkə */
export function recordAnswer(p: Profile, q: Question, ok: boolean, sec: number, today = dateKey()): Profile {
  const day = p.stats.days[today] ?? { n: 0, ok: 0, sec: 0 };
  const cat = p.stats.byCat[q.cat] ?? { n: 0, ok: 0 };
  const seen = q.gen ? p.seen : { ...p.seen, [q.id]: Date.now() };
  const next: Profile = {
    ...touchStreak(p, today),
    seen,
    xp: p.xp + (ok ? q.pts : 2),
    coins: p.coins + (ok ? Math.max(1, Math.round(q.pts / 10)) : 0),
    stats: {
      ...p.stats,
      answered: p.stats.answered + 1,
      correct: p.stats.correct + (ok ? 1 : 0),
      timeSec: p.stats.timeSec + Math.round(sec),
      byCat: { ...p.stats.byCat, [q.cat]: { n: cat.n + 1, ok: cat.ok + (ok ? 1 : 0) } },
      days: { ...p.stats.days, [today]: { n: day.n + 1, ok: day.ok + (ok ? 1 : 0), sec: day.sec + Math.round(sec) } },
    },
  };
  return next;
}

/** Oyun (puzzle və s.) vaxtını statistikaya əlavə edir */
export function recordPlayTime(p: Profile, sec: number, today = dateKey()): Profile {
  const day = p.stats.days[today] ?? { n: 0, ok: 0, sec: 0 };
  return {
    ...touchStreak(p, today),
    stats: { ...p.stats, timeSec: p.stats.timeSec + Math.round(sec), days: { ...p.stats.days, [today]: { ...day, sec: day.sec + Math.round(sec) } } },
  };
}

export interface Reward {
  xp?: number;
  stars?: number;
  coins?: number;
  badge?: string;
}

/** İdempotent mükafat: eyni açar üçün yalnız bir dəfə */
export function applyAward(p: Profile, key: string, r: Reward): [Profile, boolean] {
  if (p.awarded[key]) return [p, false];
  return [
    {
      ...p,
      xp: p.xp + (r.xp ?? 0),
      stars: p.stars + (r.stars ?? 0),
      coins: p.coins + (r.coins ?? 0),
      badges: r.badge && !p.badges.includes(r.badge) ? [...p.badges, r.badge] : p.badges,
      awarded: { ...p.awarded, [key]: Date.now() },
    },
    true,
  ];
}

/** Mərhələ nəticəsi: ulduzlar yalnız artım fərqi qədər verilir (təkrar oyun əlavə ulduz yaratmır) */
export function applyStage(p: Profile, stageId: string, stars: number): [Profile, number] {
  const prev = p.stages[stageId] ?? 0;
  const gain = Math.max(0, stars - prev);
  if (!gain) return [p, 0];
  return [{ ...p, stages: { ...p.stages, [stageId]: stars }, stars: p.stars + gain, coins: p.coins + gain * 5, xp: p.xp + gain * 15 }, gain];
}

export function freshDaily(p: Profile, today = dateKey()): Profile {
  return p.daily?.date === today ? p : { ...p, daily: emptyDaily(today) };
}

export const DAILY_TARGET = { logic: 5, math: 5, general: 5 } as const;
export const dailyComplete = (d: DailyState) =>
  d.logic >= DAILY_TARGET.logic && d.math >= DAILY_TARGET.math && d.general >= DAILY_TARGET.general && d.puzzle;

export interface Achievement {
  id: string;
  emoji: string;
  coins: number;
  test: (p: Profile, d: AppData) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_quiz', emoji: '🎯', coins: 10, test: (p) => p.stats.games >= 1 },
  { id: 'correct_10', emoji: '🔟', coins: 15, test: (p) => p.stats.correct >= 10 },
  { id: 'correct_100', emoji: '💯', coins: 50, test: (p) => p.stats.correct >= 100 },
  { id: 'logic_master', emoji: '🧠', coins: 40, test: (p) => (p.stats.byCat.logic?.ok ?? 0) >= 30 },
  { id: 'math_champ', emoji: '🧮', coins: 40, test: (p) => (p.stats.byCat.math?.ok ?? 0) >= 30 },
  { id: 'az_expert', emoji: '🇦🇿', coins: 40, test: (p) => (p.stats.byCat.azerbaijan?.ok ?? 0) >= 25 },
  { id: 'streak_7', emoji: '🔥', coins: 50, test: (p) => p.streak.best >= 7 },
  { id: 'puzzle_master', emoji: '🧩', coins: 40, test: (p) => Object.keys(p.awarded).filter((k) => k.startsWith('puzzle:')).length >= 10 },
  { id: 'daily_3', emoji: '📅', coins: 30, test: (p) => Object.keys(p.awarded).filter((k) => k.startsWith('daily:')).length >= 3 },
  { id: 'world_done', emoji: '🏰', coins: 50, test: (p) => Object.entries(p.stages).some(([k, v]) => k.endsWith(':boss') && v > 0) },
  { id: 'level_5', emoji: '⭐', coins: 30, test: (p) => levelOf(p.xp).level >= 5 },
  { id: 'week_champ', emoji: '🏆', coins: 100, test: (p) => p.badges.includes('week_champ') },
];

/** Yeni qazanılmış nailiyyətləri əlavə edir; qaytarır: [profil, yeni nailiyyət id-ləri] */
export function checkAchievements(p: Profile, d: AppData): [Profile, string[]] {
  const fresh = ACHIEVEMENTS.filter((a) => !p.achievements.includes(a.id) && a.test(p, d));
  if (!fresh.length) return [p, []];
  return [{ ...p, achievements: [...p.achievements, ...fresh.map((a) => a.id)], coins: p.coins + fresh.reduce((s, a) => s + a.coins, 0) }, fresh.map((a) => a.id)];
}

/** Bu gün tətbiqdə keçirilən dəqiqələr */
export const minutesToday = (p: Profile, today = dateKey()) => Math.round((p.stats.days[today]?.sec ?? 0) / 60);
