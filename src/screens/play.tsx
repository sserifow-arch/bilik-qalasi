import { useMemo, useRef, useState, type ComponentType } from 'react';
import { useProfile, useStore, type Session } from '../lib/store';
import type { Category, Profile, Question } from '../lib/types';
import { ageGroupOf, groupIndex } from '../lib/types';
import { pickQuestions, BASE_DIFF } from '../engine/select';
import { genMath, genPattern, genSequence } from '../engine/generators';
import { clamp, dateKey, hashStr, mulberry32, weekKey } from '../lib/util';
import { WORLD, stagesOf, starsFromScore, GAME_EMOJI, type GameId } from '../data/worlds';
import { QuizRunner, type QuizResult } from '../components/QuizRunner';
import { Btn, Card, Confetti, Screen, Stars, TopBar } from '../components/ui';
import { Mascot } from '../components/Mascot';
import type { StrKey } from '../i18n/strings';
import { FlagsGame, MatchGame, MemoryGame, SortGame, type GameProps } from '../games/pairs';
import { DiffGame, FindGame, MazeGame, OrderGame, SlideGame } from '../games/boards';
import { MissingGame, OddGame, ShadowGame } from '../games/rounds';
import { sfx } from '../lib/sound';

const COMPONENT: Partial<Record<GameId, ComponentType<GameProps>>> = {
  match: MatchGame, flags: FlagsGame, memory: MemoryGame, sort: SortGame, order: OrderGame, diff: DiffGame, find: FindGame, maze: MazeGame, slide: SlideGame, shadow: ShadowGame, odd: OddGame, missing: MissingGame,
};
/** Sual əsaslı mini oyunlar */
const QUIZ_GAMES: GameId[] = ['tf', 'riddle', 'sequence'];
const HINT: Partial<Record<GameId, StrKey>> = {
  match: 'h_match', flags: 'h_flags', memory: 'h_memory', sort: 'h_sort', order: 'h_order', diff: 'h_diff', maze: 'h_maze', slide: 'h_slide', shadow: 'h_shadow', odd: 'h_odd', missing: 'h_missing', sequence: 'h_sequence',
};

export const gameTitleKey = (g: GameId) => ('g_' + (g === 'flags' ? 'flags' : g)) as StrKey;

/** Sessiya üçün çətinlik (1..5) */
function sessionDiff(s: Session, p: Profile): number {
  const base = BASE_DIFF[ageGroupOf(p.age)];
  if (s.kind === 'stage') {
    const def = stagesOf(WORLD[s.worldId])[s.idx];
    return clamp(base + def.dOffset, 1, 5);
  }
  return base;
}
export const gameLevel = (s: Session, p: Profile) => clamp(sessionDiff(s, p) + groupIndex(ageGroupOf(p.age)) - 1, 1, 5);

/** Sessiya üçün suallar */
export function buildQuestions(s: Session, p: Profile, game?: GameId): { qs: Question[]; timer: number; tf: number; seed: number } {
  const seed = Date.now();
  const rng = mulberry32(seed);
  const g = ageGroupOf(p.age);
  const d = sessionDiff(s, p);
  const nByAge = [6, 8, 10, 10][groupIndex(g)];
  if (game === 'riddle') return { qs: Array.from({ length: 6 }, () => genMath(rng, d)), timer: 0, tf: 0, seed };
  if (game === 'sequence') return { qs: Array.from({ length: 6 }, (_, i) => (i % 2 ? genSequence(rng, d) : genPattern(rng, d))), timer: 0, tf: 0, seed };
  if (game === 'tf') {
    const cats: Category[] = s.kind === 'stage' ? WORLD[s.worldId].cats : ['general', 'azerbaijan', 'colors', 'time'];
    return { qs: pickQuestions({ profile: p, cats, n: 8, d, rng, filter: s.kind === 'stage' ? WORLD[s.worldId].filter : undefined }), timer: 0, tf: 1, seed };
  }
  if (s.kind === 'category') return { qs: pickQuestions({ profile: p, cats: [s.cat], n: nByAge, rng }), timer: 0, tf: 0, seed };
  if (s.kind === 'daily') {
    const cats: Category[] = s.part === 'logic' ? ['logic'] : s.part === 'math' ? ['math'] : ['general', 'azerbaijan', 'colors', 'time', 'language'];
    return { qs: pickQuestions({ profile: p, cats, n: 5, rng }), timer: 0, tf: 0, seed };
  }
  if (s.kind === 'weekly') {
    // Eyni yaş qrupundakı hər kəs eyni sualları alır (ədalətli yarış)
    const ws = hashStr(weekKey() + ':' + g);
    const wr = mulberry32(ws);
    const qs = pickQuestions({ profile: { age: p.age, seen: {} }, cats: ['general', 'azerbaijan', 'math', 'logic', 'colors', 'time', 'language'], n: 10, rng: wr, genShare: 0.2 });
    return { qs, timer: [30, 25, 20, 20][groupIndex(g)], tf: 0, seed: ws };
  }
  if (s.kind === 'stage') {
    const w = WORLD[s.worldId];
    const def = stagesOf(w)[s.idx];
    const n = def.kind === 'game' ? 6 : def.n;
    return { qs: pickQuestions({ profile: p, cats: w.cats, n, d, rng, filter: w.filter }), timer: def.kind === 'boss' ? [0, 30, 25, 20][groupIndex(g)] : 0, tf: def.kind === 'boss' ? 0.3 : 0, seed };
  }
  return { qs: pickQuestions({ profile: p, cats: ['general'], n: 6, rng }), timer: 0, tf: 0, seed };
}

export function sessionTitle(s: Session, t: (k: StrKey, p?: Record<string, string | number>) => string, L: (o: any) => string): string {
  if (s.kind === 'category') return t(('cat_' + s.cat) as StrKey);
  if (s.kind === 'daily') return t('dailyTask');
  if (s.kind === 'weekly') return t('weeklyQuiz');
  if (s.kind === 'free') return t(gameTitleKey(s.game));
  const def = stagesOf(WORLD[s.worldId])[s.idx];
  return `${L(WORLD[s.worldId].name)} · ${def.kind === 'boss' ? t('boss') : t('stage', { n: s.idx + 1 })}`;
}

/** Nəticəni qeyd edir (mükafatlar idempotentdir) və nəticə ekranını açır */
function useFinish() {
  const { replace, stage, award, updateProfile, setData, t } = useStore();
  const p = useProfile();
  return (s: Session, ok: number, n: number, score: number, sec: number) => {
    updateProfile((x) => ({ ...x, stats: { ...x.stats, games: x.stats.games + 1 } }));
    const today = dateKey();
    if (s.kind === 'stage') stage(stagesOf(WORLD[s.worldId])[s.idx].id, starsFromScore(score));
    if (s.kind === 'free') award(`puzzle:${s.game}:${today}`, { coins: 5, xp: 10 });
    if (s.kind === 'daily') {
      updateProfile((x) => ({ ...x, daily: s.part === 'puzzle' ? { ...x.daily, puzzle: true } : { ...x.daily, [s.part]: Math.max(x.daily[s.part], n) } }));
      if (s.part === 'puzzle') award(`puzzle:daily:${today}`, { coins: 5 });
    }
    if (s.kind === 'weekly') {
      const wk = weekKey();
      const total = ok * 100 + Math.max(0, 300 - sec);
      setData((d) => {
        const list = d.weekly[wk] ?? [];
        if (list.some((e) => e.pid === p.id)) return d;
        return { ...d, weekly: { ...d.weekly, [wk]: [...list, { pid: p.id, name: p.name, avatar: p.avatar, group: ageGroupOf(p.age), score: total, ok, n, time: sec, at: Date.now() }] } };
      });
      award(`weekly:${wk}`, { coins: 20, xp: 50 }, { emoji: '🏆', title: t('weeklyQuiz') });
    }
    replace({ name: 'result', session: s, ok, n, score });
  };
}

export function QuizHost({ session }: { session: Session }) {
  const { t, L } = useStore();
  const p = useProfile();
  const finish = useFinish();
  const built = useMemo(() => buildQuestions(session, p), [session]);
  const isWeekly = session.kind === 'weekly';
  return (
    <QuizRunner
      title={sessionTitle(session, t, L)}
      questions={built.qs}
      timer={built.timer}
      tfShare={built.tf}
      seed={isWeekly ? built.seed : undefined}
      onDone={(r: QuizResult) => finish(session, r.ok, r.n, r.n ? r.ok / r.n : 0, r.sec)}
    />
  );
}

export function GameHost({ session, game }: { session: Session; game: GameId }) {
  const { t, playTime } = useStore();
  const p = useProfile();
  const finish = useFinish();
  const start = useRef(Date.now());
  const level = gameLevel(session, p);
  const built = useMemo(() => (QUIZ_GAMES.includes(game) ? buildQuestions(session, p, game) : null), [session, game]);
  if (built)
    return (
      <QuizRunner
        title={t(gameTitleKey(game))}
        questions={built.qs}
        tfShare={built.tf}
        onDone={(r) => finish(session, r.ok, r.n, r.n ? r.ok / r.n : 0, r.sec)}
      />
    );
  const C = COMPONENT[game]!;
  return (
    <Screen>
      <TopBar title={`${GAME_EMOJI[game]} ${t(gameTitleKey(game))}`} />
      {HINT[game] && <p className="mb-3 text-center font-extrabold text-violet-700">{t(HINT[game]!)}</p>}
      <C
        level={level}
        onDone={(score) => {
          const sec = (Date.now() - start.current) / 1000;
          playTime(sec);
          sfx.win();
          finish(session, Math.round(score * 10), 10, score, sec);
        }}
      />
    </Screen>
  );
}

export function ResultScreen({ session, ok, n, score }: { session: Session; ok: number; n: number; score: number }) {
  const { t, replace, reset, back, L } = useStore();
  const p = useProfile();
  const stars = starsFromScore(score);
  const msg: StrKey = (['res0', 'res1', 'res2', 'res3'] as StrKey[])[stars];
  const [k] = useState(() => Date.now());
  const isGame = session.kind === 'free' || (session.kind === 'stage' && stagesOf(WORLD[session.worldId])[session.idx].kind === 'game');
  const gameId: GameId | null = session.kind === 'free' ? session.game : session.kind === 'stage' && stagesOf(WORLD[session.worldId])[session.idx].kind === 'game' ? (stagesOf(WORLD[session.worldId])[session.idx] as any).game : null;
  const retry = () => (gameId && isGame ? replace({ name: 'game', session, game: gameId }) : replace({ name: 'quiz', session }));
  const nextStage = session.kind === 'stage' && session.idx + 1 < stagesOf(WORLD[session.worldId]).length && stars > 0 ? session.idx + 1 : null;
  const playNext = () => {
    if (nextStage === null || session.kind !== 'stage') return;
    const s: Session = { kind: 'stage', worldId: session.worldId, idx: nextStage };
    const def = stagesOf(WORLD[session.worldId])[nextStage];
    replace(def.kind === 'game' ? { name: 'game', session: s, game: def.game } : { name: 'quiz', session: s });
  };
  return (
    <Screen>
      {stars >= 2 && <Confetti key={k} n={50} />}
      <div className="pt-[calc(env(safe-area-inset-top)+30px)]" />
      <Card className="bk-pop text-center">
        <div className="flex justify-center">
          <Mascot size={110} mood={stars >= 2 ? 'cheer' : stars === 1 ? 'happy' : 'think'} />
        </div>
        <div className="text-5xl tracking-widest">
          <Stars n={stars} />
        </div>
        <h2 className="mt-2 text-2xl font-black text-slate-800">{t(msg)}</h2>
        {!isGame && <p className="mt-1 text-lg font-extrabold text-slate-500">{t('resultLine', { ok, n })}</p>}
        <p className="mt-1 text-sm font-bold text-violet-500">{sessionTitle(session, t, L)}</p>
        <div className="mt-3 flex justify-center gap-2 text-sm font-black">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">🪙 {p.coins}</span>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">XP {p.xp}</span>
        </div>
        <div className="mt-5 grid gap-3">
          {nextStage !== null && (
            <Btn kind="success" onClick={playNext}>
              {t('continue')} →
            </Btn>
          )}
          {session.kind !== 'weekly' && (
            <Btn kind={nextStage !== null ? 'ghost' : 'primary'} onClick={retry}>
              🔄 {t('retry')}
            </Btn>
          )}
          <Btn kind="ghost" onClick={session.kind === 'stage' || session.kind === 'daily' || session.kind === 'weekly' ? back : () => reset({ name: 'home' })}>
            {session.kind === 'stage' ? '🗺️ ' + t('adventure') : session.kind === 'daily' ? '📅 ' + t('dailyTask') : session.kind === 'weekly' ? '🏆 ' + t('winners') : '🏠 ' + t('home')}
          </Btn>
        </div>
      </Card>
    </Screen>
  );
}
