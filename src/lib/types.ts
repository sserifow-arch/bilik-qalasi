export type Lang = 'az' | 'ru' | 'en';
export const LANGS: Lang[] = ['az', 'ru', 'en'];
export type T3 = Record<Lang, string>;

/** a: 3–5, b: 6–8, c: 9–12, d: 13–15 */
export type AgeGroup = 'a' | 'b' | 'c' | 'd';
export const AGE_GROUPS: AgeGroup[] = ['a', 'b', 'c', 'd'];
export const AGE_RANGE: Record<AgeGroup, [number, number]> = { a: [3, 5], b: [6, 8], c: [9, 12], d: [13, 15] };
export const ageGroupOf = (age: number): AgeGroup => (age <= 5 ? 'a' : age <= 8 ? 'b' : age <= 12 ? 'c' : 'd');
export const groupIndex = (g: AgeGroup) => AGE_GROUPS.indexOf(g);

export type Category = 'general' | 'azerbaijan' | 'math' | 'colors' | 'time' | 'language' | 'logic';
export const CATEGORIES: Category[] = ['general', 'azerbaijan', 'math', 'logic', 'colors', 'time', 'language'];

export interface Question {
  id: string;
  cat: Category;
  ages: AgeGroup[];
  /** 1 çox asan … 5 ekspert */
  d: number;
  img: string;
  q: T3;
  o: T3[];
  /** düzgün variantın indeksi */
  a: number;
  e: T3;
  pts: number;
  /** avtomatik yaradılan sual */
  gen?: boolean;
}

export interface CatStat {
  n: number;
  ok: number;
}
export interface DayStat {
  n: number;
  ok: number;
  sec: number;
}

export interface DailyState {
  date: string;
  logic: number;
  math: number;
  general: number;
  puzzle: boolean;
  claimed: boolean;
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  lang: Lang;
  avatar: string;
  createdAt: number;
  xp: number;
  stars: number;
  coins: number;
  streak: { count: number; best: number; last: string };
  achievements: string[];
  badges: string[];
  /** mərhələ id → ən yaxşı ulduz (0–3) */
  stages: Record<string, number>;
  /** sual id → son görülmə vaxtı */
  seen: Record<string, number>;
  stats: { answered: number; correct: number; timeSec: number; games: number; byCat: Record<string, CatStat>; days: Record<string, DayStat> };
  daily: DailyState;
  owned: string[];
  equipped: string[];
  /** idempotent mükafat açarları */
  awarded: Record<string, number>;
}

export interface WeeklyEntry {
  pid: string;
  name: string;
  avatar: string;
  group: AgeGroup;
  score: number;
  ok: number;
  n: number;
  time: number;
  at: number;
}

export interface AppData {
  version: 3;
  profiles: Profile[];
  activeId: string | null;
  sound: boolean;
  music: boolean;
  /** valideyn PIN-in həşi */
  pin: string | null;
  /** gündəlik istifadə hədəfi (dəqiqə), 0 — limitsiz */
  dailyLimit: number;
  lastLang: Lang;
  /** həftə açarı → nəticələr */
  weekly: Record<string, WeeklyEntry[]>;
  seenIntro: boolean;
}
