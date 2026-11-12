import { useEffect, useMemo, useState } from 'react';
import { useProfile, useStore } from '../lib/store';
import { AGE_GROUPS, AGE_RANGE, ageGroupOf, type AgeGroup, type WeeklyEntry } from '../lib/types';
import { ACHIEVEMENTS } from '../lib/progress';
import { addDays, hashStr, msToWeekEnd, mulberry32, pick, ri, weekKey, weekLabel } from '../lib/util';
import { Avatar, Brainy, Btn, Card, Screen, TopBar } from '../components/ui';
import type { StrKey } from '../i18n/strings';

const DEMO_NAMES = ['Ulduz', 'Kosmos', 'Şimşək', 'Bulud', 'Dəniz', 'Günəş', 'Nar', 'Lalə'];
const DEMO_AV = ['🦉', '🐬', '🐢', '🦜', '🐿️', '🦔'];

export interface Row extends WeeklyEntry {
  demo?: boolean;
}

/** Demo iştirakçılar (açıq şəkildə «demo» kimi göstərilir) — həftə və yaş qrupuna görə sabit */
export function demoRows(wk: string, g: AgeGroup): Row[] {
  const r = mulberry32(hashStr('demo:' + wk + ':' + g));
  return Array.from({ length: 5 }, (_, i) => {
    const ok = ri(r, 4, 9);
    const time = ri(r, 60, 240);
    return { pid: `demo${i}`, name: `${pick(r, DEMO_NAMES)}-${ri(r, 1, 99)}`, avatar: pick(r, DEMO_AV), group: g, score: ok * 100 + Math.max(0, 300 - time), ok, n: 10, time, at: 0, demo: true };
  });
}

/** Sıralama: xal azalan, bərabərlikdə daha qısa vaxt */
export const rank = (rows: Row[]) => [...rows].sort((a, b) => b.score - a.score || a.time - b.time);

export function rowsFor(weekly: Record<string, WeeklyEntry[]>, wk: string, g: AgeGroup): Row[] {
  return rank([...(weekly[wk] ?? []).filter((e) => e.group === g), ...demoRows(wk, g)]);
}

const MEDAL = ['🥇', '🥈', '🥉'];

function Table({ rows, me }: { rows: Row[]; me: string }) {
  const { t } = useStore();
  if (!rows.length) return <p className="py-4 text-center font-bold text-slate-400">{t('noResults')}</p>;
  return (
    <ol className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={r.pid} className={`flex items-center gap-3 rounded-2xl px-2 py-2 ${r.pid === me ? 'bg-amber-100' : i % 2 ? '' : 'bg-violet-50/60'}`}>
          <span className="w-8 text-center text-xl font-black">{MEDAL[i] ?? i + 1}</span>
          <Avatar emoji={r.avatar} size={38} />
          <span className="min-w-0 flex-1 truncate font-extrabold">
            {r.name}
            {r.demo && <span className="ml-1.5 rounded-md bg-slate-200 px-1.5 py-0.5 text-[11px] font-black uppercase text-slate-500">{t('demo')}</span>}
          </span>
          <span className="text-right">
            <span className="block font-black text-violet-700">{r.score}</span>
            <span className="text-[11px] font-bold text-slate-400">
              {r.ok}/{r.n} · {r.time}s
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Keçən həftənin birincisinə «Həftənin çempionu» nişanı (bir dəfə) */
export function useChampionCheck() {
  const { data, award, t, profile } = useStore();
  useEffect(() => {
    if (!profile) return;
    const last = addDays(weekKey(), -7);
    const rows = rowsFor(data.weekly, last, ageGroupOf(profile.age));
    if (rows[0]?.pid === profile.id) award(`champ:${last}`, { coins: 100, stars: 5, badge: 'week_champ' }, { emoji: '🏆', title: t('champion') });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);
}

export function Weekly() {
  const { t, go, data } = useStore();
  const p = useProfile();
  const wk = weekKey();
  const g = ageGroupOf(p.age);
  const mine = (data.weekly[wk] ?? []).find((e) => e.pid === p.id);
  const rows = rowsFor(data.weekly, wk, g);
  const place = rows.findIndex((r) => r.pid === p.id) + 1;
  const left = msToWeekEnd();
  return (
    <Screen>
      <TopBar title={t('weeklyQuiz')} />
      <Card className="!bg-gradient-to-br !from-violet-500 !to-fuchsia-500 text-center text-white">
        <div className="text-6xl">🏆</div>
        <div className="mt-1 text-sm font-black opacity-90">{weekLabel(wk)}</div>
        <div className="text-sm font-bold opacity-90">{t('endsIn', { d: Math.floor(left / 864e5), h: Math.floor((left % 864e5) / 36e5) })}</div>
        {mine ? (
          <div className="mt-3">
            <div className="text-sm font-bold opacity-90">{t('yourScore')}</div>
            <div className="text-4xl font-black">{mine.score}</div>
            <div className="font-extrabold">
              {t('yourPlace')}: {MEDAL[place - 1] ?? ''} {place}
            </div>
          </div>
        ) : (
          <>
            <p className="mt-3 font-bold">{t('weeklyIntro')}</p>
            <Btn kind="accent" className="mt-4 w-full" onClick={() => go({ name: 'quiz', session: { kind: 'weekly' } })}>
              ▶ {t('play')}
            </Btn>
          </>
        )}
      </Card>
      <h2 className="mb-2 mt-5 px-1 text-lg font-black">
        {t('thisWeek')} · {AGE_RANGE[g].join('–')}
      </h2>
      <Card>
        <Table rows={rows} me={p.id} />
      </Card>
      <p className="mt-3 px-2 text-center text-xs font-bold text-slate-500">{t('demoNote')}</p>
    </Screen>
  );
}

export function Leaderboard() {
  const { t, data } = useStore();
  const p = useProfile();
  const [g, setG] = useState<AgeGroup>(ageGroupOf(p.age));
  const [which, setWhich] = useState<0 | 1>(0);
  const wk = which === 0 ? weekKey() : addDays(weekKey(), -7);
  const rows = useMemo(() => rowsFor(data.weekly, wk, g), [data.weekly, wk, g]);
  return (
    <Screen>
      <TopBar title={t('winners')} />
      <div className="mb-3 flex gap-2 rounded-2xl bg-violet-100 p-1">
        {[t('thisWeek'), t('lastWeek')].map((x, i) => (
          <button key={x} onClick={() => setWhich(i as 0 | 1)} className={`flex-1 rounded-xl py-2.5 text-sm font-black ${which === i ? 'bg-white text-violet-700 shadow-sm' : 'text-violet-500'}`}>
            {x}
          </button>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {AGE_GROUPS.map((x) => (
          <button key={x} onClick={() => setG(x)} className={`rounded-xl py-2 text-sm font-black ${g === x ? 'bg-violet-500 text-white' : 'bg-white text-slate-600 shadow-sm'}`}>
            {AGE_RANGE[x].join('–')}
          </button>
        ))}
      </div>
      {rows[0] && (
        <Card className="mb-3 flex items-center gap-3 !bg-gradient-to-r !from-amber-100 !to-yellow-100">
          <span className="text-4xl">👑</span>
          <div>
            <div className="text-xs font-black uppercase text-amber-700">{t('champion')}</div>
            <div className="text-lg font-black">
              {rows[0].avatar} {rows[0].name} {rows[0].demo ? `(${t('demo')})` : ''}
            </div>
          </div>
        </Card>
      )}
      <Card>
        <div className="mb-2 text-sm font-bold text-slate-400">{weekLabel(wk)}</div>
        <Table rows={rows} me={p.id} />
      </Card>
      <p className="mt-3 px-2 text-center text-xs font-bold text-slate-500">{t('demoNote')}</p>
    </Screen>
  );
}

export function Achievements() {
  const { t } = useStore();
  const p = useProfile();
  return (
    <Screen>
      <TopBar title={t('achievements')} />
      <Brainy text={`🏅 ${p.achievements.length} / ${ACHIEVEMENTS.length}`} mood="cheer" size={64} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const has = p.achievements.includes(a.id);
          return (
            <Card key={a.id} className={`text-center ${has ? '!bg-gradient-to-br !from-amber-50 !to-yellow-100' : 'opacity-60'}`}>
              <div className={`text-5xl ${has ? '' : 'grayscale'}`}>{has ? a.emoji : '🔒'}</div>
              <div className="mt-2 font-black leading-tight">{t(('a_' + a.id) as StrKey)}</div>
              <div className="mt-1 text-xs font-bold text-amber-700">🪙 {a.coins}</div>
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}
