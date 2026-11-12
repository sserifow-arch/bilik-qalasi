import { useMemo, useRef, useState, type PointerEvent as RPE } from 'react';
import type { T3 } from '../lib/types';
import { useStore } from '../lib/store';
import { sample, shuffle } from '../lib/util';
import { sfx } from '../lib/sound';
import { COUNTRIES } from '../data/countries';
import { Card } from '../components/ui';

export interface GameProps {
  level: number; // 1..5
  onDone: (score: number) => void;
}

const t = (az: string, ru: string, en: string): T3 => ({ az, ru, en });
export const WORDS: { e: string; n: T3 }[] = [
  { e: '🐶', n: t('İt', 'Собака', 'Dog') }, { e: '🐱', n: t('Pişik', 'Кошка', 'Cat') }, { e: '🐮', n: t('İnək', 'Корова', 'Cow') },
  { e: '🐴', n: t('At', 'Лошадь', 'Horse') }, { e: '🐟', n: t('Balıq', 'Рыба', 'Fish') }, { e: '🐦', n: t('Quş', 'Птица', 'Bird') },
  { e: '🍎', n: t('Alma', 'Яблоко', 'Apple') }, { e: '🍌', n: t('Banan', 'Банан', 'Banana') }, { e: '🍇', n: t('Üzüm', 'Виноград', 'Grapes') },
  { e: '🥕', n: t('Kök', 'Морковь', 'Carrot') }, { e: '🌞', n: t('Günəş', 'Солнце', 'Sun') }, { e: '🌙', n: t('Ay', 'Луна', 'Moon') },
  { e: '🌳', n: t('Ağac', 'Дерево', 'Tree') }, { e: '🏠', n: t('Ev', 'Дом', 'House') }, { e: '🚗', n: t('Maşın', 'Машина', 'Car') },
  { e: '✈️', n: t('Təyyarə', 'Самолёт', 'Plane') }, { e: '📚', n: t('Kitab', 'Книга', 'Book') }, { e: '⚽', n: t('Top', 'Мяч', 'Ball') },
  { e: '🎈', n: t('Şar', 'Шарик', 'Balloon') }, { e: '⭐', n: t('Ulduz', 'Звезда', 'Star') }, { e: '🐘', n: t('Fil', 'Слон', 'Elephant') },
  { e: '🦋', n: t('Kəpənək', 'Бабочка', 'Butterfly') }, { e: '🌸', n: t('Çiçək', 'Цветок', 'Flower') }, { e: '🚲', n: t('Velosiped', 'Велосипед', 'Bicycle') },
];

/** Uyğunlaşdırma: sol tərəfdə söz, sağda şəkil. Səhvlər xalı azaldır. */
function PairMatch({ pairs, onDone }: { pairs: { left: string; right: string; big?: boolean }[]; onDone: (s: number) => void }) {
  const right = useMemo(() => shuffle(Math.random, pairs.map((p, i) => ({ ...p, i }))), [pairs]);
  const left = useMemo(() => shuffle(Math.random, pairs.map((p, i) => ({ ...p, i }))), [pairs]);
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [bad, setBad] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const tapRight = (i: number) => {
    if (sel === null || done.has(i)) return;
    if (i === sel) {
      sfx.ok();
      const nd = new Set(done).add(i);
      setDone(nd);
      setSel(null);
      if (nd.size === pairs.length) setTimeout(() => onDone(Math.max(0.3, 1 - mistakes * 0.12)), 500);
    } else {
      sfx.bad();
      setMistakes((m) => m + 1);
      setBad(i);
      setTimeout(() => setBad(null), 400);
    }
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2.5">
        {left.map((p) => (
          <button
            key={p.i}
            disabled={done.has(p.i)}
            onClick={() => (sfx.tap(), setSel(p.i))}
            className={`flex min-h-[60px] w-full items-center justify-center rounded-2xl px-2 py-2 text-center font-extrabold shadow-sm transition ${p.big ? 'text-4xl' : 'text-[17px]'} ${
              done.has(p.i) ? 'bg-emerald-100 text-emerald-700 opacity-60' : sel === p.i ? 'bg-violet-500 text-white' : 'bg-white'
            }`}
          >
            {p.left}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {right.map((p) => (
          <button
            key={p.i}
            disabled={done.has(p.i)}
            onClick={() => tapRight(p.i)}
            className={`flex min-h-[60px] w-full items-center justify-center rounded-2xl bg-white px-2 py-2 text-center shadow-sm transition ${p.big ? 'text-[17px] font-extrabold' : 'text-4xl'} ${done.has(p.i) ? 'bg-emerald-100 opacity-60' : ''} ${bad === p.i ? 'bk-shake bg-rose-100' : ''}`}
          >
            {p.right}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MatchGame({ level, onDone }: GameProps) {
  const { L } = useStore();
  const pairs = useMemo(() => sample(Math.random, WORDS, Math.min(6, 3 + Math.floor(level / 2))).map((w) => ({ left: L(w.n), right: w.e })), [level, L]);
  return <PairMatch pairs={pairs} onDone={onDone} />;
}

export function FlagsGame({ level, onDone }: GameProps) {
  const { L } = useStore();
  const pool = COUNTRIES.slice(0, Math.min(COUNTRIES.length, 8 + level * 4));
  const pairs = useMemo(() => sample(Math.random, pool, Math.min(6, 3 + Math.floor(level / 2))).map((c) => ({ left: c.flag, right: L(c.name), big: true })), [level, L]);
  return <PairMatch pairs={pairs} onDone={onDone} />;
}

const MEM = ['🐶', '🐱', '🦁', '🐼', '🐸', '🐵', '🦊', '🐰', '🐯', '🐨', '🐷', '🐮', '🐔', '🦄', '🐙', '🦋'];
export function MemoryGame({ level, onDone }: GameProps) {
  const n = [3, 4, 6, 8, 10][Math.min(4, level - 1)];
  const cards = useMemo(() => {
    const pick = sample(Math.random, MEM, n);
    return shuffle(Math.random, [...pick, ...pick]);
  }, [n]);
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const lock = useRef(false);
  const { t } = useStore();
  const flip = (i: number) => {
    if (lock.current || done.has(i) || open.includes(i)) return;
    sfx.tap();
    const o = [...open, i];
    setOpen(o);
    if (o.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = o;
    if (cards[a] === cards[b]) {
      const nd = new Set(done).add(a).add(b);
      setDone(nd);
      setOpen([]);
      sfx.ok();
      if (nd.size === cards.length) setTimeout(() => onDone(Math.min(1, (n + 2) / Math.max(n, moves + 1))), 600);
    } else {
      lock.current = true;
      setTimeout(() => {
        setOpen([]);
        lock.current = false;
      }, 750);
    }
  };
  const cols = cards.length <= 6 ? 3 : 4;
  return (
    <>
      <div className="mb-3 text-center font-extrabold text-violet-700">
        {t('moves')}: {moves}
      </div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map((c, i) => {
          const shown = open.includes(i) || done.has(i);
          return (
            <button
              key={i}
              onClick={() => flip(i)}
              className={`grid aspect-square place-items-center rounded-2xl text-[min(10vw,44px)] shadow-[0_4px_0_rgba(91,60,200,.18)] transition-all duration-300 ${
                shown ? (done.has(i) ? 'bg-emerald-100' : 'bg-white') : 'bg-gradient-to-br from-violet-400 to-sky-400 text-white'
              }`}
            >
              {shown ? c : '?'}
            </button>
          );
        })}
      </div>
    </>
  );
}

const COLOR_ITEMS: Record<string, { emoji: string; name: T3; items: string[] }> = {
  red: { emoji: '🟥', name: t('Qırmızı', 'Красный', 'Red'), items: ['🍎', '🍓', '🍅', '🌹', '🚒', '❤️', '🍒'] },
  yellow: { emoji: '🟨', name: t('Sarı', 'Жёлтый', 'Yellow'), items: ['🍌', '🌻', '🍋', '🐥', '🧀', '🌽', '💛'] },
  green: { emoji: '🟩', name: t('Yaşıl', 'Зелёный', 'Green'), items: ['🥦', '🐸', '🥒', '🍀', '🌲', '🍏', '💚'] },
  blue: { emoji: '🟦', name: t('Göy', 'Синий', 'Blue'), items: ['🐳', '💙', '🧊', '🔵', '👖', '🫐', '🐟'] },
  orange: { emoji: '🟧', name: t('Narıncı', 'Оранжевый', 'Orange'), items: ['🥕', '🍊', '🎃', '🦊', '🏀', '🧡'] },
  purple: { emoji: '🟪', name: t('Bənövşəyi', 'Фиолетовый', 'Purple'), items: ['🍇', '🍆', '🔮', '💜', '🟣'] },
};

/** Rənginə görə ayır: sürüşdür (drag) və ya toxun → qutu */
export function SortGame({ level, onDone }: GameProps) {
  const { L } = useStore();
  const bins = useMemo(() => sample(Math.random, Object.keys(COLOR_ITEMS), Math.min(4, 2 + Math.floor(level / 2))), [level]);
  const items = useMemo(() => shuffle(Math.random, bins.flatMap((b) => sample(Math.random, COLOR_ITEMS[b].items, 2 + Math.floor(level / 3)).map((e, i) => ({ id: `${b}${i}`, e, c: b })))), [bins, level]);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [shakeBin, setShakeBin] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const binRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const drop = (id: string, bin: string) => {
    const it = items.find((x) => x.id === id)!;
    if (it.c === bin) {
      sfx.ok();
      const np = { ...placed, [id]: bin };
      setPlaced(np);
      setSel(null);
      if (Object.keys(np).length === items.length) setTimeout(() => onDone(Math.max(0.3, 1 - mistakes * 0.1)), 500);
    } else {
      sfx.bad();
      setMistakes((m) => m + 1);
      setShakeBin(bin);
      setTimeout(() => setShakeBin(null), 400);
    }
  };
  const binAt = (x: number, y: number) =>
    Object.entries(binRefs.current).find(([, el]) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    })?.[0];

  return (
    <>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${bins.length}, 1fr)` }}>
        {bins.map((b) => (
          <div
            key={b}
            ref={(el) => {
              binRefs.current[b] = el;
            }}
            onClick={() => sel && drop(sel, b)}
            className={`min-h-[120px] rounded-3xl border-4 border-dashed bg-white p-2 text-center ${sel ? 'border-violet-300' : 'border-slate-200'} ${shakeBin === b ? 'bk-shake border-rose-300' : ''}`}
          >
            <div className="text-2xl">{COLOR_ITEMS[b].emoji}</div>
            <div className="text-xs font-extrabold text-slate-600">{L(COLOR_ITEMS[b].name)}</div>
            <div className="mt-1 flex flex-wrap justify-center gap-0.5 text-2xl">
              {items.filter((x) => placed[x.id] === b).map((x) => (
                <span key={x.id}>{x.e}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Card className="mt-4">
        <div className="flex flex-wrap justify-center gap-2">
          {items
            .filter((x) => !placed[x.id])
            .map((x) => (
              <button
                key={x.id}
                onClick={() => (sfx.tap(), setSel(x.id))}
                onPointerDown={(e: RPE) => {
                  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                  setDrag({ id: x.id, x: e.clientX, y: e.clientY });
                }}
                onPointerMove={(e: RPE) => drag?.id === x.id && setDrag({ id: x.id, x: e.clientX, y: e.clientY })}
                onPointerUp={(e: RPE) => {
                  if (drag?.id === x.id) {
                    const b = binAt(e.clientX, e.clientY);
                    if (b) drop(x.id, b);
                  }
                  setDrag(null);
                }}
                className={`grid h-16 w-16 touch-none place-items-center rounded-2xl text-4xl shadow-sm ${sel === x.id ? 'bg-violet-200 ring-4 ring-violet-400' : 'bg-violet-50'}`}
                style={drag?.id === x.id ? { opacity: 0.35 } : undefined}
              >
                {x.e}
              </button>
            ))}
        </div>
      </Card>
      {drag && (
        <div className="pointer-events-none fixed z-50 text-5xl" style={{ left: drag.x - 26, top: drag.y - 30 }}>
          {items.find((x) => x.id === drag.id)?.e}
        </div>
      )}
    </>
  );
}
