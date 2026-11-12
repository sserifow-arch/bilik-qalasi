import { type ReactNode } from 'react';
import { useStore } from '../lib/store';
import { sfx } from '../lib/sound';
import { Mascot, type Mood } from './Mascot';
import { ACCESSORIES } from '../data/cosmetics';

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bk-screen mx-auto min-h-screen max-w-xl px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] ${className}`}>{children}</div>;
}

export function TopBar({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  const { back, t } = useStore();
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-3 bg-[#f5f3ff]/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur">
      <button
        aria-label={t('back')}
        onClick={() => {
          sfx.tap();
          (onBack ?? back)();
        }}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-xl text-violet-700 shadow-[0_3px_10px_rgba(91,60,200,.12)] active:scale-95"
      >
        ←
      </button>
      <h1 className="min-w-0 flex-1 truncate text-xl font-black text-slate-800">{title}</h1>
      {right}
    </header>
  );
}

export function Card({ children, className = '', onClick, disabled }: { children: ReactNode; className?: string; onClick?: () => void; disabled?: boolean }) {
  const cls = `block w-full rounded-[26px] bg-white p-4 text-left shadow-[0_6px_20px_rgba(91,60,200,.10)] ${onClick && !disabled ? 'transition active:scale-[.97]' : ''} ${disabled ? 'opacity-50' : ''} ${className}`;
  if (!onClick) return <div className={cls}>{children}</div>;
  return (
    <button
      className={cls}
      onClick={() => {
        if (disabled) return;
        sfx.tap();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

type Kind = 'primary' | 'accent' | 'success' | 'ghost' | 'danger' | 'teal';
const K: Record<Kind, string> = {
  primary: 'bg-violet-500 text-white shadow-[0_5px_0_#5b3fd0]',
  accent: 'bg-amber-400 text-amber-950 shadow-[0_5px_0_#d08a00]',
  success: 'bg-emerald-500 text-white shadow-[0_5px_0_#0f8a5f]',
  teal: 'bg-teal-500 text-white shadow-[0_5px_0_#0b7f74]',
  danger: 'bg-rose-500 text-white shadow-[0_5px_0_#b4234a]',
  ghost: 'bg-violet-50 text-violet-700',
};
export function Btn({ children, kind = 'primary', onClick, disabled, className = '' }: { children: ReactNode; kind?: Kind; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      disabled={disabled}
      onClick={() => {
        sfx.tap();
        onClick?.();
      }}
      className={`rounded-2xl px-5 py-3.5 text-lg font-extrabold transition active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-40 ${K[kind]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-slate-700 shadow-sm ${className}`}>{children}</span>;
}

export function Stars({ n, of = 3, className = '' }: { n: number; of?: number; className?: string }) {
  return (
    <span className={className} aria-label={`${n}/${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={i < n ? '' : 'opacity-25 grayscale'}>
          ⭐
        </span>
      ))}
    </span>
  );
}

export function Progress({ value, className = '', color = 'bg-violet-500' }: { value: number; className?: string; color?: string }) {
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-violet-100 ${className}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} />
    </div>
  );
}

/** Maskotun nitq balonu */
export function Brainy({ text, mood = 'happy', size = 72 }: { text: string; mood?: Mood; size?: number }) {
  return (
    <div className="flex items-end gap-2">
      <Mascot size={size} mood={mood} />
      <div className="mb-3 flex-1 rounded-3xl rounded-bl-md bg-white px-4 py-3 text-[15px] font-bold leading-snug text-slate-700 shadow-[0_6px_20px_rgba(91,60,200,.10)]">{text}</div>
    </div>
  );
}

/** Avatar + taxılmış aksesuarlar */
export function Avatar({ emoji, equipped = [], size = 56 }: { emoji: string; equipped?: string[]; size?: number }) {
  const acc = ACCESSORIES.filter((a) => equipped.includes(a.id));
  return (
    <span className="relative inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-100 to-sky-100" style={{ width: size, height: size, fontSize: size * 0.58 }}>
      <span aria-hidden>{emoji}</span>
      {acc.slice(0, 2).map((a, i) => (
        <span key={a.id} aria-hidden className="absolute" style={{ fontSize: size * 0.34, ...(i === 0 ? { top: -size * 0.16, left: size * 0.3 } : { bottom: -size * 0.05, right: -size * 0.1 }) }}>
          {a.emoji}
        </span>
      ))}
    </span>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+10px)] z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} className="bk-pop flex items-center gap-3 rounded-3xl bg-white px-4 py-3 shadow-xl">
          <span className="text-3xl">{t.emoji}</span>
          <div>
            <div className="font-black text-slate-800">{t.title}</div>
            {t.sub && <div className="text-sm font-bold text-violet-600">{t.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Konfetti (yalnız uğur anlarında) */
export function Confetti({ n = 40 }: { n?: number }) {
  const cs = ['#7c5cff', '#26c6da', '#ffc83d', '#ff8a3d', '#2ecc71', '#ff6b8a'];
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <i
          key={i}
          className="bk-confetti absolute top-[-20px] block h-3.5 w-2.5 rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, background: cs[i % cs.length], animationDelay: `${(i % 10) * 0.05}s`, animationDuration: `${1.6 + (i % 5) * 0.3}s`, ['--dx' as any]: `${((i * 53) % 160) - 80}px` }}
        />
      ))}
    </div>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-lg font-black text-slate-800">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
