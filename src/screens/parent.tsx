import { useState } from 'react';
import { useProfile, useStore } from '../lib/store';
import { CATEGORIES, LANGS, type Lang, type Profile } from '../lib/types';
import { levelOf, newProfile } from '../lib/progress';
import { addDays, dateKey, pinHash } from '../lib/util';
import { AVATARS, ACCESSORIES } from '../data/cosmetics';
import { WORLDS, stagesOf } from '../data/worlds';
import { Avatar, Btn, Card, Pill, Progress, Screen, Section, TopBar } from '../components/ui';
import { Logo } from '../components/Mascot';
import type { StrKey } from '../i18n/strings';
import { FLAG, LANG_NAME } from './main';
import { sfx } from '../lib/sound';

/* ---------------- PIN klaviaturası ---------------- */
function PinPad({ title, error, onDone }: { title: string; error?: string; onDone: (pin: string) => void }) {
  const [v, setV] = useState('');
  const press = (d: string) => {
    sfx.tap();
    const nv = (v + d).slice(0, 4);
    setV(nv);
    if (nv.length === 4) setTimeout(() => (onDone(nv), setV('')), 150);
  };
  return (
    <Card className="text-center">
      <div className="text-5xl">🔐</div>
      <p className="mt-2 text-lg font-black">{title}</p>
      <div className="my-4 flex justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-4 w-4 rounded-full ${i < v.length ? 'bg-violet-500' : 'bg-violet-100'}`} />
        ))}
      </div>
      {error && <p className="mb-2 font-bold text-rose-500">{error}</p>}
      <div className="mx-auto grid max-w-[260px] grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d) =>
          d ? (
            <button key={d} onClick={() => (d === '⌫' ? setV(v.slice(0, -1)) : press(d))} className="rounded-2xl bg-violet-50 py-4 text-2xl font-black text-violet-800 active:bg-violet-200">
              {d}
            </button>
          ) : (
            <span key="x" />
          ),
        )}
      </div>
    </Card>
  );
}

/* ---------------- Valideyn bölməsi ---------------- */
export function Parent() {
  const { t, data, setData } = useStore();
  const [ok, setOk] = useState(false);
  const [first, setFirst] = useState<string | null>(null);
  const [err, setErr] = useState('');
  if (!ok) {
    return (
      <Screen>
        <TopBar title={t('parents')} />
        <p className="mb-3 text-center font-bold text-slate-500">{t('parentGate')}</p>
        {data.pin ? (
          <PinPad title={t('enterPin')} error={err} onDone={(pin) => (pinHash(pin) === data.pin ? setOk(true) : (sfx.bad(), setErr(t('pinWrong'))))} />
        ) : first === null ? (
          <PinPad title={t('createPin')} onDone={(pin) => setFirst(pin)} />
        ) : (
          <PinPad
            title={t('repeatPin')}
            error={err}
            onDone={(pin) => {
              if (pin !== first) {
                sfx.bad();
                setErr(t('pinMismatch'));
                setFirst(null);
                return;
              }
              setData((d) => ({ ...d, pin: pinHash(pin) }));
              setOk(true);
            }}
          />
        )}
      </Screen>
    );
  }
  return <ParentPanel />;
}

function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return h ? `${h} h ${m} m` : `${m} m`;
}

function ParentPanel() {
  const { t, data, setData } = useStore();
  const [pid, setPid] = useState<string | undefined>(data.activeId ?? data.profiles[0]?.id);
  const p = data.profiles.find((x) => x.id === pid);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [renaming, setRenaming] = useState('');
  const [changePin, setChangePin] = useState(false);
  const upd = (fn: (x: Profile) => Profile) => setData((d) => ({ ...d, profiles: d.profiles.map((x) => (x.id === pid ? fn(x) : x)) }));
  const ask = (k: string, act: () => void) => {
    if (confirm === k) {
      act();
      setConfirm(null);
    } else setConfirm(k);
  };
  if (changePin)
    return (
      <Screen>
        <TopBar title={t('changePin')} onBack={() => setChangePin(false)} />
        <PinPad
          title={t('createPin')}
          onDone={(pin) => {
            setData((d) => ({ ...d, pin: pinHash(pin) }));
            setChangePin(false);
          }}
        />
      </Screen>
    );
  const days = Array.from({ length: 7 }, (_, i) => addDays(dateKey(), i - 6));
  const mins = days.map((d) => Math.round((p?.stats.days[d]?.sec ?? 0) / 60));
  const maxM = Math.max(10, ...mins);
  const cats = p ? CATEGORIES.map((c) => ({ c, s: p.stats.byCat[c] })).filter((x) => x.s && x.s.n >= 3).map((x) => ({ c: x.c, r: x.s!.ok / x.s!.n, n: x.s!.n })) : [];
  const best = [...cats].sort((a, b) => b.r - a.r).filter((x) => x.r >= 0.6).slice(0, 2);
  const weak = [...cats].sort((a, b) => a.r - b.r).filter((x) => x.r < 0.7).slice(0, 2);
  const stagesDone = p ? WORLDS.flatMap(stagesOf).filter((s) => (p.stages[s.id] ?? 0) > 0).length : 0;
  const totalStages = WORLDS.flatMap(stagesOf).length;
  return (
    <Screen>
      <TopBar title={t('parents')} />
      {data.profiles.length > 1 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {data.profiles.map((x) => (
            <button key={x.id} onClick={() => setPid(x.id)} className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 font-black ${pid === x.id ? 'bg-violet-500 text-white' : 'bg-white shadow-sm'}`}>
              {x.avatar} {x.name}
            </button>
          ))}
        </div>
      )}
      {p && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={t('totalTime')} value={fmtTime(p.stats.timeSec)} />
            <Stat label={t('answered')} value={String(p.stats.answered)} />
            <Stat label={t('accuracy')} value={p.stats.answered ? `${Math.round((p.stats.correct / p.stats.answered) * 100)}%` : '—'} />
            <Stat label={t('bestStreak')} value={`🔥 ${p.streak.best}`} />
            <Stat label={t('stagesDone')} value={`${stagesDone}/${totalStages}`} />
            <Stat label={t('level', { n: '' }).trim()} value={`${levelOf(p.xp).level} · XP ${p.xp}`} />
          </div>
          <Section title={t('weekChart')}>
            <Card>
              <div className="flex h-36 items-end gap-2">
                {mins.map((m, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-black text-violet-600">{m}</span>
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-sky-400" style={{ height: `${(m / maxM) * 100}px`, minHeight: 3 }} />
                    <span className="text-[10px] font-bold text-slate-400">{days[i].slice(8)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
          <Section title={t('bestTopics')}>
            <Card className="space-y-2">
              {best.length ? best.map((x) => <TopicRow key={x.c} c={x.c} r={x.r} n={x.n} />) : <p className="font-bold text-slate-400">—</p>}
            </Card>
          </Section>
          <Section title={t('weakTopics')}>
            <Card className="space-y-2">
              {weak.length ? weak.map((x) => <TopicRow key={x.c} c={x.c} r={x.r} n={x.n} />) : <p className="font-bold text-slate-400">—</p>}
            </Card>
          </Section>
          <Section title={t('manageProfiles')}>
            <Card className="space-y-3">
              <div className="flex gap-2">
                <input value={renaming} onChange={(e) => setRenaming(e.target.value)} maxLength={20} placeholder={p.name} className="min-w-0 flex-1 rounded-xl border-2 border-violet-100 px-3 py-2 font-bold outline-none" />
                <Btn kind="ghost" className="!px-3 !py-2 !text-base" disabled={!renaming.trim()} onClick={() => (upd((x) => ({ ...x, name: renaming.trim() })), setRenaming(''))}>
                  {t('rename')}
                </Btn>
              </div>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <button key={l} onClick={() => upd((x) => ({ ...x, lang: l }))} className={`rounded-xl px-3 py-2 font-black ${p.lang === l ? 'bg-violet-500 text-white' : 'bg-violet-50'}`}>
                    {FLAG[l]} {l.toUpperCase()}
                  </button>
                ))}
              </div>
              <Btn
                kind="ghost"
                className="w-full"
                onClick={() =>
                  ask('reset', () =>
                    upd((x) => {
                      const fresh = newProfile(x.name, x.age, x.lang, x.avatar);
                      return { ...fresh, id: x.id, createdAt: x.createdAt };
                    }),
                  )
                }
              >
                {confirm === 'reset' ? '⚠️ ' + t('confirmTap') : '↺ ' + t('resetProgress')}
              </Btn>
              <Btn
                kind="danger"
                className="w-full"
                onClick={() =>
                  ask('del', () => {
                    setData((d) => {
                      const profiles = d.profiles.filter((x) => x.id !== pid);
                      return { ...d, profiles, activeId: d.activeId === pid ? null : d.activeId };
                    });
                    setPid(data.profiles.find((x) => x.id !== pid)?.id);
                  })
                }
              >
                {confirm === 'del' ? '⚠️ ' + t('confirmTap') : '🗑️ ' + t('deleteProfile')}
              </Btn>
            </Card>
          </Section>
        </>
      )}
      <Section title={t('settings')}>
        <Card className="space-y-4">
          <div>
            <div className="mb-2 font-black">{t('dailyLimit')}</div>
            <div className="flex flex-wrap gap-2">
              {[0, 15, 30, 45, 60].map((m) => (
                <button key={m} onClick={() => setData((d) => ({ ...d, dailyLimit: m }))} className={`rounded-xl px-3 py-2 font-black ${data.dailyLimit === m ? 'bg-violet-500 text-white' : 'bg-violet-50'}`}>
                  {m ? t('minutes', { n: m }) : t('noLimit')}
                </button>
              ))}
            </div>
          </div>
          <Toggle label={t('sound')} on={data.sound} set={(v) => setData((d) => ({ ...d, sound: v }))} />
          <Toggle label={t('music')} on={data.music} set={(v) => setData((d) => ({ ...d, music: v }))} />
          <Btn kind="ghost" className="w-full" onClick={() => setChangePin(true)}>
            🔐 {t('changePin')}
          </Btn>
        </Card>
      </Section>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="!p-3">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="text-xl font-black text-violet-700">{value}</div>
    </Card>
  );
}
function TopicRow({ c, r, n }: { c: string; r: number; n: number }) {
  const { t } = useStore();
  return (
    <div>
      <div className="flex justify-between text-sm font-black">
        <span>{t(('cat_' + c) as StrKey)}</span>
        <span>
          {Math.round(r * 100)}% · {n}
        </span>
      </div>
      <Progress value={r} color={r >= 0.7 ? 'bg-emerald-500' : 'bg-amber-400'} />
    </div>
  );
}
function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button onClick={() => set(!on)} className="flex w-full items-center justify-between">
      <span className="font-black">{label}</span>
      <span className={`relative h-8 w-14 rounded-full transition ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
      </span>
    </button>
  );
}

/* ---------------- Uşaq tənzimləmələri ---------------- */
export function Settings() {
  const { t, data, setData, updateProfile, reset } = useStore();
  const p = useProfile();
  return (
    <Screen>
      <TopBar title={t('settings')} />
      <Card className="space-y-4">
        <div>
          <div className="mb-2 font-black">{t('language')}</div>
          <div className="grid grid-cols-3 gap-2">
            {LANGS.map((l: Lang) => (
              <button key={l} onClick={() => updateProfile((x) => ({ ...x, lang: l }))} className={`rounded-2xl py-3 font-black ${p.lang === l ? 'bg-violet-500 text-white' : 'bg-violet-50'}`}>
                <span className="block text-2xl">{FLAG[l]}</span>
                <span className="text-xs">{LANG_NAME[l]}</span>
              </button>
            ))}
          </div>
        </div>
        <Toggle label={t('sound')} on={data.sound} set={(v) => setData((d) => ({ ...d, sound: v }))} />
        <Toggle label={t('music')} on={data.music} set={(v) => setData((d) => ({ ...d, music: v }))} />
        <Btn
          kind="ghost"
          className="w-full"
          onClick={() => {
            setData((d) => ({ ...d, activeId: null }));
            reset({ name: 'profiles' });
          }}
        >
          👥 {t('switchChild')}
        </Btn>
      </Card>
    </Screen>
  );
}

/* ---------------- Profil: avatarlar və aksesuarlar ---------------- */
export function ProfileScreen() {
  const { t, updateProfile, L, pushToast } = useStore();
  const p = useProfile();
  const lv = levelOf(p.xp);
  return (
    <Screen>
      <TopBar title={t('profile')} right={<Pill>🪙 {p.coins}</Pill>} />
      <Card className="text-center">
        <Avatar emoji={p.avatar} equipped={p.equipped} size={110} />
        <div className="mt-2 text-2xl font-black">{p.name}</div>
        <div className="font-bold text-slate-500">
          {t('level', { n: lv.level })} · XP {p.xp}/{lv.next}
        </div>
        <Progress value={lv.progress} className="mx-auto mt-2 max-w-xs" />
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Pill>⭐ {p.stars}</Pill>
          <Pill>🏅 {p.achievements.length}</Pill>
          <Pill>🔥 {p.streak.best}</Pill>
          {p.badges.includes('week_champ') && <Pill>🏆 {t('champion')}</Pill>}
        </div>
      </Card>
      <Section title={t('avatars')}>
        <div className="grid grid-cols-5 gap-2">
          {AVATARS.map((a) => {
            const open = lv.level >= a.level;
            return (
              <button
                key={a.id}
                onClick={() => (open ? updateProfile((x) => ({ ...x, avatar: a.id })) : pushToast({ emoji: '🔒', title: t('unlockAt', { n: a.level }) }))}
                className={`relative aspect-square rounded-2xl text-3xl ${p.avatar === a.id ? 'bg-amber-200 ring-2 ring-amber-400' : 'bg-white shadow-sm'} ${open ? '' : 'opacity-40 grayscale'}`}
              >
                {a.id}
                {!open && <span className="absolute bottom-0.5 right-1 text-[10px] font-black text-slate-600">L{a.level}</span>}
              </button>
            );
          })}
        </div>
      </Section>
      <Section title={t('accessories')}>
        <div className="grid grid-cols-2 gap-3">
          {ACCESSORIES.map((a) => {
            const owned = p.owned.includes(a.id);
            const on = p.equipped.includes(a.id);
            return (
              <Card key={a.id} className="flex items-center gap-3 !p-3">
                <span className="text-4xl">{a.emoji}</span>
                <span className="flex-1">
                  <span className="block font-black">{L(a.name)}</span>
                  {owned ? (
                    <button
                      onClick={() => updateProfile((x) => ({ ...x, equipped: on ? x.equipped.filter((e) => e !== a.id) : [...x.equipped, a.id].slice(-2) }))}
                      className={`mt-1 rounded-lg px-2 py-1 text-xs font-black ${on ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}
                    >
                      {on ? '✓ ' + t('takeOff') : t('wear')}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (p.coins < a.price) return pushToast({ emoji: '🪙', title: t('notEnough') });
                        sfx.coin();
                        updateProfile((x) => (x.owned.includes(a.id) ? x : { ...x, coins: x.coins - a.price, owned: [...x.owned, a.id], equipped: [...x.equipped, a.id].slice(-2) }));
                      }}
                      className="mt-1 rounded-lg bg-amber-100 px-2 py-1 text-xs font-black text-amber-800"
                    >
                      {t('buy')} 🪙 {a.price}
                    </button>
                  )}
                </span>
              </Card>
            );
          })}
        </div>
      </Section>
    </Screen>
  );
}

export function Help() {
  const { t } = useStore();
  return (
    <Screen>
      <TopBar title={t('help')} />
      <Card className="text-center">
        <Logo size={90} />
        <p className="mt-4 whitespace-pre-line text-left font-semibold leading-relaxed text-slate-700">{t('helpText')}</p>
        <p className="mt-4 text-sm font-bold text-slate-400">{t('version')} 2.0.0</p>
      </Card>
    </Screen>
  );
}
