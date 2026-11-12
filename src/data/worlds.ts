import type { Category, Question, T3 } from '../lib/types';

export type GameId =
  | 'tf' | 'match' | 'sort' | 'memory' | 'order' | 'sequence' | 'shadow' | 'diff' | 'slide' | 'flags' | 'maze' | 'riddle' | 'find' | 'odd' | 'missing';

export interface World {
  id: string;
  name: T3;
  emoji: string;
  /** Tailwind gradient sinifləri */
  grad: string;
  cats: Category[];
  filter?: (q: Question) => boolean;
  games: GameId[];
}

const t = (az: string, ru: string, en: string): T3 => ({ az, ru, en });

export const WORLDS: World[] = [
  { id: 'colors', name: t('Rənglər adası', 'Остров цветов', 'Colour Island'), emoji: '🎨', grad: 'from-pink-300 to-amber-200', cats: ['colors'], games: ['sort', 'odd', 'missing', 'memory'] },
  { id: 'animals', name: t('Heyvanlar aləmi', 'Мир животных', 'Animal Kingdom'), emoji: '🦁', grad: 'from-lime-300 to-emerald-300', cats: ['general'], filter: (q) => /^(anm|brd|plt|nat)/.test(q.id), games: ['shadow', 'match', 'memory', 'find'] },
  { id: 'math', name: t('Riyaziyyat dağı', 'Гора математики', 'Maths Mountain'), emoji: '⛰️', grad: 'from-sky-300 to-indigo-300', cats: ['math'], games: ['order', 'riddle', 'missing', 'sequence'] },
  { id: 'logic', name: t('Məntiq meşəsi', 'Лес логики', 'Logic Forest'), emoji: '🌲', grad: 'from-emerald-300 to-teal-300', cats: ['logic'], games: ['sequence', 'maze', 'odd', 'missing'] },
  { id: 'space', name: t('Kosmos dünyası', 'Космический мир', 'Space World'), emoji: '🚀', grad: 'from-indigo-400 to-violet-400', cats: ['general'], filter: (q) => /^(spc|pln|sci|geo)/.test(q.id), games: ['tf', 'memory', 'find', 'maze'] },
  { id: 'azerbaijan', name: t('Azərbaycanı kəşf et', 'Открой Азербайджан', 'Discover Azerbaijan'), emoji: '🇦🇿', grad: 'from-cyan-300 to-emerald-300', cats: ['azerbaijan'], games: ['flags', 'match', 'tf', 'slide'] },
  { id: 'castle', name: t('Sirli qala', 'Таинственный замок', 'Mystery Castle'), emoji: '🏰', grad: 'from-violet-300 to-fuchsia-300', cats: ['time', 'language', 'logic'], games: ['slide', 'diff', 'memory', 'find'] },
  { id: 'champ', name: t('Ağıllılar çempionatı', 'Чемпионат умников', 'Brainiac Championship'), emoji: '🏆', grad: 'from-amber-300 to-orange-300', cats: ['general', 'azerbaijan', 'math', 'logic', 'time', 'language', 'colors'], games: ['tf', 'riddle', 'maze', 'diff'] },
];
export const WORLD: Record<string, World> = Object.fromEntries(WORLDS.map((w) => [w.id, w]));

export const STAGES_PER_WORLD = 8;

export type StageDef =
  | { id: string; kind: 'quiz'; n: number; dOffset: number }
  | { id: string; kind: 'game'; game: GameId; dOffset: number }
  | { id: string; kind: 'boss'; n: number; dOffset: number };

/** Mərhələlər: tək nömrəlilər — viktorina, cüt nömrəlilər — mini oyun, sonda final (boss) */
export function stagesOf(w: World): StageDef[] {
  const out: StageDef[] = [];
  for (let i = 1; i <= STAGES_PER_WORLD; i++) {
    const dOffset = Math.floor((i - 1) / 3);
    const id = `${w.id}:${i}`;
    if (i % 2 === 1) out.push({ id, kind: 'quiz', n: 5 + Math.floor(i / 3), dOffset });
    else out.push({ id, kind: 'game', game: w.games[(i / 2 - 1) % w.games.length], dOffset });
  }
  out.push({ id: `${w.id}:boss`, kind: 'boss', n: 10, dOffset: 2 });
  return out;
}

export const stageOpen = (stages: Record<string, number>, list: StageDef[], i: number) => i === 0 || (stages[list[i - 1].id] ?? 0) > 0;

export function worldOpen(stages: Record<string, number>, wi: number): boolean {
  if (wi === 0) return true;
  const prev = WORLDS[wi - 1];
  return stagesOf(prev).filter((s) => (stages[s.id] ?? 0) > 0).length >= 3;
}

export const starsFromScore = (r: number) => (r >= 0.999 ? 3 : r >= 0.7 ? 2 : r >= 0.5 ? 1 : 0);

export const GAME_EMOJI: Record<GameId, string> = {
  tf: '✅', match: '🔗', sort: '🧺', memory: '🃏', order: '🔢', sequence: '🔁', shadow: '👤', diff: '🔍', slide: '🧩', flags: '🚩', maze: '🌀', riddle: '🧮', find: '👀', odd: '🔺', missing: '❔',
};
export const LOGIC_GAMES: GameId[] = ['sequence', 'odd', 'missing', 'maze', 'order', 'riddle', 'tf'];
export const PUZZLE_GAMES: GameId[] = ['slide', 'memory', 'match', 'sort', 'shadow', 'diff', 'find', 'flags'];
