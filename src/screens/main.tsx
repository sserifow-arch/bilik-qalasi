import { useMemo, useState } from 'react';
import { useProfile, useStore } from '../lib/store';
import { AGE_GROUPS, AGE_RANGE, CATEGORIES, LANGS, ageGroupOf, type Lang } from '../lib/types';
import { levelOf, newProfile, dailyComplete, DAILY_TARGET, minutesToday } from '../lib/progress';
import { msToWeekEnd, weekKey } from '../lib/util';
import { AVATARS } from '../data/cosmetics';
import { WORLDS, stagesOf, stageOpen, worldOpen, GAME_EMOJI, LOGIC_GAMES, PUZZLE_GAMES } from '../data/worlds';
import { BANK } from '../engine/bank';
import { Avatar, Brainy, Btn, Card, Pill, Progress, Screen, Section, Stars, TopBar } from '../components/ui';
import { Logo, Mascot } from '../components/Mascot';
import { gameTitleKey } from './play';
import type { StrKey } from '../i18n/strings';
import { sfx } from '../lib/sound';

const FLAG: Record<Lang, string> = { az: '🇦🇿', ru: '🇷🇺', en: '🇬🇧' };
const LANG_NAME: Record<Lang, string> = { az: 'Azərbaycanca', ru: 'Русский', en: 'English' };
const CAT_EMOJI: Record<string, string> = { general: '🌍', azerbaijan: '🇦🇿', math: '🔢', logic: '🧠', colors: '🎨', time: '⏰', language: '🔤' };
const CAT_TINT: Record<string, string> = { general: 'from-sky-100 to-cyan-100', azerbaijan: 'from-cyan-100 to-emerald-100', math: 'from-violet-100 to-indigo-100', logic: 'from-rose-100 to-orange-100', colors: 'from-pink-100 to-amber-100', time: 'from-amber-100 to-yellow-100', language: 'from-teal-100 to-lime-100' };

/* ---------------- Açılış / qarşılama ---------------- */
export function Welcome() {
  const { t, setData, reset, data } = useStore();
  return (
    <Screen className="flex flex-col items-center justify-center text-center">
      <div className="pt-[calc(env(safe-area-inset-top)+60px)]" />
      <Logo size={150} />
      <p className="mt-3 text-lg font-extrabold text-violet-600">{t('appTagline')}</p>
      <div className="mt-8 w-full rounded-3xl bg-white px-5 py-4 text-lg font-extrabold text-slate-700 shadow-[0_6px_20px_rgba(91,60,200,.10)]">
        {t('welcome1')} {t('welcome2')}
      </div>
      <Btn
        kind="accent"
        className="mt-8 w-full !py-5 !text-2xl"
        onClick={() => {
          setData((d) => ({ ...d, seenIntro: true }));
          reset(data.profiles.length ? { name: 'profiles' } : { name: 'lang' });
        }}
      >
        {t('start')} 🚀
      </Btn>
    </Screen>
  );
}

export function LangSelect() {
  const { setData, go, data } = useStore();
  return (
    <Screen>
      {data.profiles.length > 0 && <TopBar title="" />}
      <div className="pt-[calc(env(safe-area-inset-top)+40px)] text-center">
        <Mascot size={110} mood="happy" />
        <h1 className="mt-2 text-2xl font-black leading-snug text-slate-800">
          Dili seç
          <br />
          Выбери язык
          <br />
          Choose a language
        </h1>
      </div>
      <div className="mt-6 space-y-3">
        {LANGS.map((l, i) => (
          <Btn
            key={l}
            kind={(['primary', 'teal', 'accent'] as const)[i]}
            className="flex w-full items-center gap-4 !py-5 text-left !text-xl"
            onClick={() => {
              setData((d) => ({ ...d, lastLang: l }));
              go({ name: 'register' });
            }}
          >
            <span className="text-4xl">{FLAG[l]}</span>
            {LANG_NAME[l]}
          </Btn>
        ))}
      </div>
    </Screen>
  );
}

export function Register() {
  const { t, setData, reset, data } = useStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [avatar, setAvatar] = useState(AVATARS[0].id);
  const ok = name.trim() && age;
  return (
    <Screen>
      <TopBar title={t('addChild')} />
      <Card className="space-y-6">
        <section>
          <label className="mb-2 block text-lg font-black">{t('yourName')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder={t('namePh')}
            className="w-full rounded-2xl border-2 border-violet-100 px-4 py-3 text-xl font-bold outline-none focus:border-violet-400"
          />
        </section>
        <section>
          <label className="mb-2 block text-lg font-black">{t('yourAge')}</label>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 13 }, (_, i) => i + 3).map((a) => (
              <button key={a} onClick={() => (sfx.tap(), setAge(a))} className={`rounded-xl py-2.5 text-lg font-black ${age === a ? 'bg-violet-500 text-white' : 'bg-violet-50 text-violet-800'}`}>
                {a}
              </button>
            ))}
          </div>
        </section>
        <section>
          <label className="mb-2 block text-lg font-black">{t('pickAvatar')}</label>
          <div className="grid grid-cols-8 gap-1.5">
            {AVATARS.filter((a) => a.level === 1).map((a) => (
              <button key={a.id} onClick={() => (sfx.tap(), setAvatar(a.id))} className={`aspect-square rounded-xl text-2xl ${avatar === a.id ? 'bg-amber-200 ring-2 ring-amber-400' : 'bg-violet-50'}`}>
                {a.id}
              </button>
            ))}
          </div>
        </section>
        <p className="text-sm font-bold text-slate-500">🔒 {t('privacyNote')}</p>
        <Btn
          kind="success"
          className="w-full"
          disabled={!ok}
          onClick={() => {
            const p = newProfile(name, age!, data.lastLang, avatar);
            setData((d) => ({ ...d, profiles: [...d.profiles, p], activeId: p.id }));
            sfx.win();
            reset({ name: 'home' });
          }}
        >
          ✨ {t('createProfile')}
        </Btn>
      </Card>
    </Screen>
  );
}

export function Profiles() {
  const { t, data, setData, reset, go } = useStore();
  return (
    <Screen>
      <div className="pt-[calc(env(safe-area-inset-top)+28px)]">
        <Logo size={96} />
      </div>
      <h2 className="mb-3 mt-6 px-1 text-xl font-black">{t('whoPlays')}</h2>
      <div className="space-y-3">
        {data.profiles.map((p) => (
          <Card
            key={p.id}
            className="flex items-center gap-4"
            onClick={() => {
              setData((d) => ({ ...d, activeId: p.id, lastLang: p.lang }));
              reset({ name: 'home' });
            }}
          >
            <Avatar emoji={p.avatar} equipped={p.equipped} size={58} />
            <span className="flex-1">
              <span className="block text-lg font-black">{p.name}</span>
              <span className="text-sm font-bold text-slate-500">
                {t('level', { n: levelOf(p.xp).level })} · ⭐ {p.stars} · {FLAG[p.lang]}
              </span>
            </span>
          </Card>
        ))}
        <Btn className="w-full" onClick={() => go({ name: 'lang' })}>
          ➕ {t('addChild')}
        </Btn>
      </div>
    </Screen>
  );
}

/* ---------------- Ana səhifə ---------------- */
export function Home() {
  const { t, go, data, L } = useStore();
  const p = useProfile();
  const lv = levelOf(p.xp);
  const d = p.daily;
  const dailyParts = (Math.min(d.logic, 5) + Math.min(d.math, 5) + Math.min(d.general, 5) + (d.puzzle ? 5 : 0)) / 20;
  const played = (data.weekly[weekKey()] ?? []).some((e) => e.pid === p.id);
  const left = msToWeekEnd();
  const g = ageGroupOf(p.age);
  const nextWorld = WORLDS.findIndex((w, i) => worldOpen(p.stages, i) && stagesOf(w).some((s) => !(p.stages[s.id] > 0)));
  const nw = WORLDS[Math.max(0, nextWorld)];
  const limit = data.dailyLimit && minutesToday(p) >= data.dailyLimit;
  const greet = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? '☀️' : h < 18 ? '🌤️' : '🌙';
  }, []);

  return (
    <Screen>
      <header className="flex items-center gap-3 pb-3 pt-[calc(env(safe-area-inset-top)+14px)]">
        <button onClick={() => go({ name: 'profile' })} aria-label={t('profile')}>
          <Avatar emoji={p.avatar} equipped={p.equipped} size={56} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xl font-black text-slate-800">
            {t('hello', { name: p.name })} {greet}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs font-black text-violet-600">{t('level', { n: lv.level })}</span>
            <Progress value={lv.progress} className="h-2 flex-1" />
          </div>
        </div>
        <button onClick={() => go({ name: 'settings' })} aria-label={t('settings')} className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-xl shadow-sm">
          ⚙️
        </button>
      </header>
      <div className="flex flex-wrap gap-2">
        <Pill>⭐ {p.stars}</Pill>
        <Pill>🪙 {p.coins}</Pill>
        <Pill>XP {p.xp}</Pill>
        {p.streak.count > 0 && <Pill className="!text-orange-600">🔥 {t('streak', { n: p.streak.count })}</Pill>}
      </div>

      {limit ? (
        <Card className="mt-4 !bg-emerald-50 text-center font-extrabold text-emerald-800">{t('limitReached')}</Card>
      ) : null}

      {/* Günün tapşırığı */}
      <Card onClick={() => go({ name: 'daily' })} className="mt-4 overflow-hidden !p-0">
        <div className="flex items-center gap-4 bg-gradient-to-r from-amber-300 via-orange-300 to-pink-300 p-4">
          <span className="text-5xl">📅</span>
          <div className="flex-1">
            <div className="text-lg font-black text-amber-950">{t('dailyTask')}</div>
            <Progress value={dailyParts} className="mt-2 !bg-white/50" color="bg-white" />
          </div>
          <span className="text-2xl font-black text-amber-950">{d.claimed ? '✅' : `${Math.round(dailyParts * 100)}%`}</span>
        </div>
      </Card>

      {/* Öyrənməyə davam et — macəra xəritəsi */}
      <Card onClick={() => go({ name: 'world', id: nw.id })} className={`mt-3 flex items-center gap-4 bg-gradient-to-br ${nw.grad}`}>
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/70 text-4xl">{nw.emoji}</span>
        <div className="flex-1">
          <div className="text-xs font-black uppercase tracking-wide text-slate-700">{t('continueLearning')}</div>
          <div className="text-lg font-black text-slate-900">{L(nw.name)}</div>
        </div>
        <span className="text-3xl">▶️</span>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Tile emoji="🗺️" title={t('adventure')} tint="from-violet-200 to-sky-200" onClick={() => go({ name: 'map' })} />
        <Tile emoji="📚" title={t('categories')} tint="from-sky-200 to-teal-200" onClick={() => go({ name: 'categories' })} />
        <Tile emoji="🧠" title={t('logicGames')} tint="from-rose-200 to-orange-200" onClick={() => go({ name: 'games', kind: 'logic' })} />
        <Tile emoji="🧩" title={t('puzzleWorld')} tint="from-teal-200 to-lime-200" onClick={() => go({ name: 'games', kind: 'puzzle' })} />
      </div>

      {/* Həftənin viktorinası */}
      <Card onClick={() => go({ name: 'weekly' })} className="mt-3 flex items-center gap-4 !bg-gradient-to-r !from-violet-500 !to-fuchsia-500 text-white">
        <span className="text-5xl">🏆</span>
        <div className="flex-1">
          <div className="text-lg font-black">{t('weeklyQuiz')}</div>
          <div className="text-sm font-bold opacity-90">{played ? '✅ ' + t('weeklyPlayed') : t('endsIn', { d: Math.floor(left / 864e5), h: Math.floor((left % 864e5) / 36e5) })}</div>
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Tile emoji="🏅" title={t('achievements')} tint="from-amber-100 to-yellow-100" small={`${p.achievements.length}`} onClick={() => go({ name: 'achievements' })} />
        <Tile emoji="🥇" title={t('winners')} tint="from-fuchsia-100 to-violet-100" small={`${t('demo')} + ${AGE_RANGE[g].join('–')}`} onClick={() => go({ name: 'leaderboard' })} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <SmallBtn emoji="👤" label={t('profile')} onClick={() => go({ name: 'profile' })} />
        <SmallBtn emoji="👨‍👩‍👧" label={t('parents')} onClick={() => go({ name: 'parent' })} />
        <SmallBtn emoji="❓" label={t('help')} onClick={() => go({ name: 'help' })} />
      </div>
    </Screen>
  );
}

function Tile({ emoji, title, tint, onClick, small }: { emoji: string; title: string; tint: string; onClick: () => void; small?: string }) {
  return (
    <Card onClick={onClick} className={`flex min-h-[118px] flex-col justify-between bg-gradient-to-br ${tint}`}>
      <span className="text-4xl">{emoji}</span>
      <span>
        <span className="block font-black leading-tight text-slate-800">{title}</span>
        {small && <span className="text-xs font-bold text-slate-600">{small}</span>}
      </span>
    </Card>
  );
}
function SmallBtn({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <Card onClick={onClick} className="text-center !p-3">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 text-xs font-extrabold leading-tight text-slate-600">{label}</div>
    </Card>
  );
}

/* ---------------- Kateqoriyalar ---------------- */
export function Categories() {
  const { t, go } = useStore();
  const p = useProfile();
  const g = ageGroupOf(p.age);
  return (
    <Screen>
      <TopBar title={t('categories')} />
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((c) => {
          const st = p.stats.byCat[c];
          const count = BANK.filter((q) => q.cat === c && q.ages.includes(g)).length;
          return (
            <Card key={c} onClick={() => go({ name: 'quiz', session: { kind: 'category', cat: c } })} className={`flex min-h-[140px] flex-col justify-between bg-gradient-to-br ${CAT_TINT[c]}`}>
              <span className="text-4xl">{CAT_EMOJI[c]}</span>
              <span>
                <span className="block font-black leading-tight text-slate-800">{t(('cat_' + c) as StrKey)}</span>
                <span className="text-xs font-bold text-slate-600">
                  {st ? `✔ ${st.ok}/${st.n}` : `${count}+`}
                </span>
              </span>
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}

/* ---------------- Macəra xəritəsi ---------------- */
export function MapScreen() {
  const { t, go, L } = useStore();
  const p = useProfile();
  return (
    <Screen>
      <TopBar title={t('adventure')} right={<Pill>⭐ {p.stars}</Pill>} />
      <div className="relative">
        <div className="absolute bottom-10 left-1/2 top-10 w-2 -translate-x-1/2 rounded-full bg-[repeating-linear-gradient(180deg,#c4b5fd_0_14px,transparent_14px_26px)]" />
        <div className="relative space-y-5">
          {WORLDS.map((w, i) => {
            const open = worldOpen(p.stages, i);
            const st = stagesOf(w);
            const done = st.filter((s) => (p.stages[s.id] ?? 0) > 0).length;
            const stars = st.reduce((s, x) => s + (p.stages[x.id] ?? 0), 0);
            return (
              <div key={w.id} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                <Card disabled={!open} onClick={() => go({ name: 'world', id: w.id })} className={`w-[78%] bg-gradient-to-br ${w.grad} ${open ? '' : 'grayscale'}`}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/70 text-4xl">{open ? w.emoji : '🔒'}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-700">
                        {t('world')} {i + 1}
                      </div>
                      <div className="font-black leading-tight text-slate-900">{L(w.name)}</div>
                      <div className="mt-1 text-sm font-bold text-slate-700">{open ? `${done}/${st.length} · ⭐ ${stars}` : t('worldLocked')}</div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}

export function WorldScreen({ id }: { id: string }) {
  const { t, go, L, pushToast } = useStore();
  const p = useProfile();
  const w = WORLDS.find((x) => x.id === id)!;
  const list = stagesOf(w);
  const cur = list.findIndex((s, i) => stageOpen(p.stages, list, i) && !(p.stages[s.id] > 0));
  return (
    <Screen>
      <TopBar title={`${w.emoji} ${L(w.name)}`} />
      <div className={`mb-4 rounded-[28px] bg-gradient-to-br p-4 ${w.grad}`}>
        <Brainy text={`${L(w.name)} · ⭐ ${list.reduce((s, x) => s + (p.stages[x.id] ?? 0), 0)} / ${list.length * 3}`} mood="happy" size={64} />
      </div>
      <div className="space-y-3">
        {list.map((s, i) => {
          const open = stageOpen(p.stages, list, i);
          const stars = p.stages[s.id] ?? 0;
          const label = s.kind === 'boss' ? t('boss') : t('stage', { n: i + 1 });
          const sub = s.kind === 'game' ? `${GAME_EMOJI[s.game]} ${t(gameTitleKey(s.game))}` : s.kind === 'boss' ? '⚔️ 10 ' + t('question').toLowerCase() : `❓ ${s.n} ${t('question').toLowerCase()}`;
          return (
            <Card
              key={s.id}
              disabled={!open}
              onClick={() => {
                if (!open) return pushToast({ emoji: '🔒', title: t('stageLocked') });
                const session = { kind: 'stage' as const, worldId: w.id, idx: i };
                go(s.kind === 'game' ? { name: 'game', session, game: s.game } : { name: 'quiz', session });
              }}
              className={`flex items-center gap-4 ${i === cur ? 'bk-pulse ring-2 ring-amber-300' : ''} ${s.kind === 'boss' ? '!bg-gradient-to-r !from-amber-100 !to-rose-100' : ''}`}
            >
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl font-black text-white ${open ? (s.kind === 'boss' ? 'bg-rose-500' : 'bg-violet-500') : 'bg-slate-300'}`}>
                {open ? (s.kind === 'boss' ? '👑' : i + 1) : '🔒'}
              </span>
              <span className="flex-1">
                <span className="block font-black">{label}</span>
                <span className="text-sm font-bold text-slate-500">{sub}</span>
              </span>
              {open && <Stars n={stars} className="text-lg" />}
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}

/* ---------------- Mini oyunlar ---------------- */
export function GamesScreen({ kind }: { kind: 'logic' | 'puzzle' }) {
  const { t, go } = useStore();
  const list = kind === 'logic' ? LOGIC_GAMES : PUZZLE_GAMES;
  return (
    <Screen>
      <TopBar title={kind === 'logic' ? t('logicGames') : t('puzzleWorld')} />
      <div className="grid grid-cols-2 gap-3">
        {list.map((g) => (
          <Card key={g} onClick={() => go({ name: 'game', session: { kind: 'free', game: g }, game: g })} className="flex min-h-[120px] flex-col justify-between">
            <span className="text-4xl">{GAME_EMOJI[g]}</span>
            <span className="font-black leading-tight text-slate-800">{t(gameTitleKey(g))}</span>
          </Card>
        ))}
      </div>
    </Screen>
  );
}

/* ---------------- Günün tapşırığı ---------------- */
export function Daily() {
  const { t, go, award, updateProfile } = useStore();
  const p = useProfile();
  const d = p.daily;
  const parts = [
    { key: 'logic' as const, label: t('daily_logic'), v: d.logic, max: DAILY_TARGET.logic, e: '🧠' },
    { key: 'math' as const, label: t('daily_math'), v: d.math, max: DAILY_TARGET.math, e: '🔢' },
    { key: 'general' as const, label: t('daily_general'), v: d.general, max: DAILY_TARGET.general, e: '🌍' },
    { key: 'puzzle' as const, label: t('daily_puzzle'), v: d.puzzle ? 1 : 0, max: 1, e: '🧩' },
  ];
  const complete = dailyComplete(d);
  const puzzleGame = (['slide', 'memory', 'find', 'diff'] as const)[new Date().getDate() % 4];
  return (
    <Screen>
      <TopBar title={t('dailyTask')} />
      <Brainy text={complete && d.claimed ? t('dailyDone') : t('dailyIntro')} mood={complete ? 'cheer' : 'happy'} />
      <div className="mt-4 space-y-3">
        {parts.map((x) => {
          const done = x.v >= x.max;
          return (
            <Card
              key={x.key}
              disabled={done}
              onClick={() =>
                x.key === 'puzzle'
                  ? go({ name: 'game', session: { kind: 'daily', part: 'puzzle' }, game: puzzleGame })
                  : go({ name: 'quiz', session: { kind: 'daily', part: x.key } })
              }
              className="flex items-center gap-4"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-3xl">{done ? '✅' : x.e}</span>
              <span className="flex-1">
                <span className="block font-black">{x.label}</span>
                <Progress value={x.v / x.max} className="mt-2" color={done ? 'bg-emerald-500' : 'bg-amber-400'} />
              </span>
            </Card>
          );
        })}
      </div>
      {complete && !d.claimed && (
        <Btn
          kind="accent"
          className="mt-5 w-full !py-5 !text-xl"
          onClick={() => {
            award(`daily:${d.date}`, { coins: 30, stars: 3, xp: 100 }, { emoji: '🎁', title: t('dailyTask') });
            updateProfile((x) => ({ ...x, daily: { ...x.daily, claimed: true } }));
          }}
        >
          🎁 {t('dailyBonus')}
        </Btn>
      )}
    </Screen>
  );
}

export { FLAG, LANG_NAME, CAT_EMOJI };
export const ALL_AGE_GROUPS = AGE_GROUPS;
