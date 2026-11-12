import type { Lang } from './types';

let ctx: AudioContext | null = null;
let soundOn = true;
let musicTimer: ReturnType<typeof setInterval> | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC() as AudioContext;
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, when = 0, dur = 0.25, vol = 0.15, type: OscillatorType = 'triangle') {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const setSound = (on: boolean) => {
  soundOn = on;
};

export const sfx = {
  tap: () => soundOn && tone(660, 0, 0.06, 0.05, 'square'),
  ok: () => {
    if (!soundOn) return;
    tone(784, 0, 0.18);
    tone(1175, 0.09, 0.3);
  },
  bad: () => {
    if (!soundOn) return;
    tone(260, 0, 0.25, 0.08, 'sine');
    tone(220, 0.12, 0.3, 0.08, 'sine');
  },
  win: () => soundOn && [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.35, 0.13)),
  coin: () => {
    if (!soundOn) return;
    tone(988, 0, 0.1, 0.1, 'square');
    tone(1319, 0.06, 0.25, 0.1, 'square');
  },
};

/** Yumşaq fon musiqisi (Web Audio ilə yaradılır, fayl tələb etmir) */
const MELODY = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047, 988, 784, 659, 587];
export function setMusic(on: boolean) {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (!on) return;
  let i = 0;
  musicTimer = setInterval(() => {
    if (document.hidden) return;
    tone(MELODY[i % MELODY.length] / 2, 0, 0.5, 0.025, 'sine');
    if (i % 4 === 0) tone(MELODY[i % MELODY.length] / 4, 0, 0.9, 0.02, 'sine');
    i++;
  }, 420);
}

const VOICE_LANG: Record<Lang, string> = { az: 'az', ru: 'ru', en: 'en' };

/** Cihazda bu dil üçün səs varmı (yalnız eyni dildə oxuyuruq, başqa dilə əvəzləmə yoxdur) */
export function canRead(lang: Lang): boolean {
  try {
    return !!speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(VOICE_LANG[lang]));
  } catch {
    return false;
  }
}

export function readAloud(text: string, lang: Lang) {
  try {
    speechSynthesis.cancel();
    const v = speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith(VOICE_LANG[lang]));
    if (!v) return;
    const u = new SpeechSynthesisUtterance(text.normalize('NFC'));
    u.voice = v;
    u.lang = v.lang;
    u.rate = 0.95;
    speechSynthesis.speak(u);
  } catch {
    /* səs dəstəklənmir */
  }
}
export function stopReading() {
  try {
    speechSynthesis.cancel();
  } catch {
    /* */
  }
}
