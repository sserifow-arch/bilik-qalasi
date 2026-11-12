import { Preferences } from '@capacitor/preferences';
import type { AppData, Lang, Profile } from './types';
import { emptyDaily, newProfile } from './progress';

export const KEY = 'brainy-kids:v3';
/** Köhnə «Bilik Qalası» tətbiqinin açarı (eyni tətbiq id-si, eyni yaddaş) */
export const LEGACY_KEY = 'bilikqalasi_v1';

export const emptyData = (lang: Lang = 'az'): AppData => ({
  version: 3,
  profiles: [],
  activeId: null,
  sound: true,
  music: false,
  pin: null,
  dailyLimit: 0,
  lastLang: lang,
  weekly: {},
  seenIntro: false,
});

/** Profili cari sxemə gətirir — çatışmayan sahələr əlavə olunur, mövcudlar qorunur */
export function normalizeProfile(raw: any): Profile {
  const base = newProfile(String(raw?.name ?? 'Dahi'), Number(raw?.age) || 6, (['az', 'ru', 'en'] as Lang[]).includes(raw?.lang) ? raw.lang : 'az', String(raw?.avatar ?? '🦁'));
  const p: Profile = { ...base, ...raw };
  p.streak = { ...base.streak, ...(raw?.streak ?? {}) };
  p.stats = { ...base.stats, ...(raw?.stats ?? {}) };
  p.stats.byCat = { ...(raw?.stats?.byCat ?? {}) };
  p.stats.days = { ...(raw?.stats?.days ?? {}) };
  p.daily = { ...emptyDaily(), ...(raw?.daily ?? {}) };
  for (const k of ['achievements', 'badges', 'owned', 'equipped'] as const) p[k] = Array.isArray(raw?.[k]) ? raw[k] : [];
  for (const k of ['stages', 'seen', 'awarded'] as const) p[k] = raw?.[k] && typeof raw[k] === 'object' ? raw[k] : {};
  for (const k of ['xp', 'stars', 'coins'] as const) p[k] = typeof raw?.[k] === 'number' && isFinite(raw[k]) ? raw[k] : base[k];
  if (typeof raw?.id === 'string') p.id = raw.id;
  return p;
}

export function normalizeData(raw: any): AppData {
  const d = { ...emptyData(), ...(raw ?? {}) } as AppData;
  d.version = 3;
  d.profiles = Array.isArray(raw?.profiles) ? raw.profiles.map(normalizeProfile) : [];
  if (!d.profiles.some((p) => p.id === d.activeId)) d.activeId = null;
  d.weekly = raw?.weekly && typeof raw.weekly === 'object' ? raw.weekly : {};
  return d;
}

/** Köhnə «Bilik Qalası» məlumatlarını köçürür: ad, yaş, dil, şəkil və qazanılmış ulduzlar */
export function migrateLegacy(raw: any): AppData | null {
  if (!raw || !Array.isArray(raw.profiles) || !raw.profiles.length) return null;
  const d = emptyData(raw.lastLang ?? 'az');
  d.sound = raw.sound !== false;
  d.profiles = raw.profiles.map((o: any) => {
    const stars = Object.values(o?.prog ?? {}).reduce((s: number, arr: any) => s + (Array.isArray(arr) ? arr.reduce((a: number, x: any) => a + (Number(x) || 0), 0) : 0), 0);
    const p = normalizeProfile({ id: o.id, name: o.name, age: o.age, lang: o.lang, avatar: o.avatar, createdAt: o.created ?? Date.now() });
    p.stars = stars;
    p.xp = stars * 20;
    p.coins = 20 + stars * 2;
    return p;
  });
  d.activeId = raw.cur && d.profiles.some((p) => p.id === raw.cur) ? raw.cur : null;
  d.seenIntro = true;
  return d;
}

function readLocal(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

/** Telefonun daimi yaddaşından oxuyur (Android: SharedPreferences, brauzer: localStorage) */
export async function loadData(): Promise<AppData> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    const json = value ?? readLocal(KEY);
    if (json) return normalizeData(JSON.parse(json));
  } catch {
    /* zədələnmiş məlumat — aşağıda yenidən cəhd */
  }
  try {
    const old = readLocal(LEGACY_KEY);
    const m = old ? migrateLegacy(JSON.parse(old)) : null;
    if (m) {
      await saveData(m);
      return m;
    }
  } catch {
    /* */
  }
  const nl = (typeof navigator !== 'undefined' ? navigator.language : 'az').slice(0, 2);
  return emptyData((['az', 'ru', 'en'] as Lang[]).includes(nl as Lang) ? (nl as Lang) : 'az');
}

let pending: ReturnType<typeof setTimeout> | null = null;
let last: AppData | null = null;

export async function saveData(d: AppData): Promise<void> {
  const json = JSON.stringify(d);
  try {
    localStorage.setItem(KEY, json);
  } catch {
    /* */
  }
  try {
    await Preferences.set({ key: KEY, value: json });
  } catch {
    /* */
  }
}

/** Tez-tez dəyişikliklər üçün yazmanı birləşdirir; tətbiq fona keçəndə dərhal yazılır */
export function saveSoon(d: AppData) {
  last = d;
  if (pending) clearTimeout(pending);
  pending = setTimeout(() => {
    pending = null;
    if (last) void saveData(last);
  }, 300);
}
export function flushSave() {
  if (pending) clearTimeout(pending);
  pending = null;
  if (last) void saveData(last);
}
