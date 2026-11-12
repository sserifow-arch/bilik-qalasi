import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppData, Category, Lang, Profile, Question, T3 } from './types';
import { emptyData, flushSave, loadData, saveSoon } from './storage';
import { applyAward, applyStage, checkAchievements, freshDaily, recordAnswer as recAnswer, recordPlayTime, type Reward } from './progress';
import { tr, type StrKey } from '../i18n/strings';
import { setMusic, setSound, sfx, stopReading } from './sound';
import type { GameId } from '../data/worlds';

export type Route =
  | { name: 'welcome' }
  | { name: 'lang' }
  | { name: 'register' }
  | { name: 'profiles' }
  | { name: 'home' }
  | { name: 'categories' }
  | { name: 'quiz'; session: Session }
  | { name: 'game'; session: Session; game: GameId }
  | { name: 'result'; session: Session; ok: number; n: number; score: number }
  | { name: 'map' }
  | { name: 'world'; id: string }
  | { name: 'games'; kind: 'logic' | 'puzzle' }
  | { name: 'daily' }
  | { name: 'weekly' }
  | { name: 'leaderboard' }
  | { name: 'achievements' }
  | { name: 'profile' }
  | { name: 'parent' }
  | { name: 'settings' }
  | { name: 'help' };

/** Oyun sessiyasının mənbəyi — nəticə harada qeyd olunacağını müəyyən edir */
export type Session =
  | { kind: 'category'; cat: Category }
  | { kind: 'stage'; worldId: string; idx: number }
  | { kind: 'daily'; part: 'logic' | 'math' | 'general' | 'puzzle' }
  | { kind: 'weekly' }
  | { kind: 'free'; game: GameId };

export interface Toast {
  id: number;
  emoji: string;
  title: string;
  sub?: string;
}

interface Ctx {
  ready: boolean;
  data: AppData;
  profile: Profile | null;
  lang: Lang;
  t: (k: StrKey, p?: Record<string, string | number>) => string;
  L: (o: T3 | string) => string;
  route: Route;
  go: (r: Route) => void;
  back: () => void;
  reset: (r: Route) => void;
  replace: (r: Route) => void;
  setData: (fn: (d: AppData) => AppData) => void;
  updateProfile: (fn: (p: Profile) => Profile) => void;
  answer: (q: Question, ok: boolean, sec: number) => void;
  playTime: (sec: number) => void;
  award: (key: string, r: Reward, toast?: { emoji: string; title: string }) => boolean;
  stage: (id: string, stars: number) => number;
  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => void;
}

const C = createContext<Ctx | null>(null);
let toastId = 0;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setState] = useState<AppData>(emptyData());
  const [ready, setReady] = useState(false);
  const ref = useRef(data);
  const [stack, setStack] = useState<Route[]>([{ name: 'welcome' }]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const commit = useCallback((d: AppData) => {
    ref.current = d;
    setState(d);
    saveSoon(d);
  }, []);

  useEffect(() => {
    void loadData().then((d) => {
      const today = d.profiles.map((p) => freshDaily(p));
      const nd = { ...d, profiles: today };
      ref.current = nd;
      setState(nd);
      setStack([!nd.seenIntro ? { name: 'welcome' } : nd.activeId ? { name: 'home' } : nd.profiles.length ? { name: 'profiles' } : { name: 'lang' }]);
      setReady(true);
    });
    const onHide = () => document.hidden && flushSave();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushSave);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushSave);
    };
  }, []);

  useEffect(() => {
    setSound(data.sound);
    setMusic(data.music);
  }, [data.sound, data.music]);

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++toastId;
    setToasts((x) => [...x, { ...t, id }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 3200);
  }, []);

  const profile = data.profiles.find((p) => p.id === data.activeId) ?? null;
  const lang: Lang = profile?.lang ?? data.lastLang;
  const t = useCallback((k: StrKey, p?: Record<string, string | number>) => tr(lang, k, p), [lang]);
  const L = useCallback((o: T3 | string) => (typeof o === 'string' ? o : o[lang] ?? o.en), [lang]);

  const setData = useCallback((fn: (d: AppData) => AppData) => commit(fn(ref.current)), [commit]);

  /** Profili yeniləyir və yeni nailiyyətləri yoxlayır */
  const updateProfile = useCallback(
    (fn: (p: Profile) => Profile) => {
      const d = ref.current;
      const cur = d.profiles.find((p) => p.id === d.activeId);
      if (!cur) return;
      const [np, fresh] = checkAchievements(fn(cur), d);
      commit({ ...d, profiles: d.profiles.map((p) => (p.id === np.id ? np : p)) });
      for (const id of fresh) {
        sfx.win();
        pushToast({ emoji: '🏅', title: tr(np.lang, 'newAchievement'), sub: tr(np.lang, ('a_' + id) as StrKey) });
      }
    },
    [commit, pushToast],
  );

  const answer = useCallback((q: Question, ok: boolean, sec: number) => updateProfile((p) => recAnswer(p, q, ok, sec)), [updateProfile]);
  const playTime = useCallback((sec: number) => updateProfile((p) => recordPlayTime(p, sec)), [updateProfile]);

  const award = useCallback(
    (key: string, r: Reward, toast?: { emoji: string; title: string }) => {
      const cur = ref.current.profiles.find((p) => p.id === ref.current.activeId);
      if (!cur || cur.awarded[key]) return false;
      updateProfile((p) => applyAward(p, key, r)[0]);
      if (toast) {
        sfx.coin();
        pushToast({ emoji: toast.emoji, title: toast.title, sub: [r.stars ? `⭐ +${r.stars}` : '', r.coins ? `🪙 +${r.coins}` : '', r.xp ? `XP +${r.xp}` : ''].filter(Boolean).join('  ') });
      }
      return true;
    },
    [updateProfile, pushToast],
  );

  const stage = useCallback(
    (id: string, stars: number) => {
      let gained = 0;
      updateProfile((p) => {
        const [np, g] = applyStage(p, id, stars);
        gained = g;
        return np;
      });
      return gained;
    },
    [updateProfile],
  );

  // Naviqasiya + Android «geri» düyməsi
  useEffect(() => {
    const onPop = () => {
      stopReading();
      setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const go = useCallback((r: Route) => {
    stopReading();
    try {
      history.pushState({ n: Date.now() }, '');
    } catch {
      /* */
    }
    setStack((s) => [...s, r]);
    window.scrollTo(0, 0);
  }, []);
  const back = useCallback(() => {
    stopReading();
    history.back();
  }, []);
  const reset = useCallback((r: Route) => {
    stopReading();
    setStack([r]);
    window.scrollTo(0, 0);
  }, []);
  const replace = useCallback((r: Route) => {
    stopReading();
    setStack((s) => [...s.slice(0, -1), r]);
    window.scrollTo(0, 0);
  }, []);

  const route = stack[stack.length - 1];
  const value = useMemo<Ctx>(
    () => ({ ready, data, profile, lang, t, L, route, go, back, reset, replace, setData, updateProfile, answer, playTime, award, stage, toasts, pushToast }),
    [ready, data, profile, lang, t, L, route, go, back, reset, replace, setData, updateProfile, answer, playTime, award, stage, toasts, pushToast],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error('StoreProvider yoxdur');
  return c;
}
export function useProfile(): Profile {
  const p = useStore().profile;
  if (!p) throw new Error('profil yoxdur');
  return p;
}
