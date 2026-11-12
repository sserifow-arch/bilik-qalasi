import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { pick, ri, sample, shuffle } from '../lib/util';
import { sfx } from '../lib/sound';
import { Btn, Card } from '../components/ui';
import type { GameProps } from './pairs';

/* ---------- Ədədləri ardıcıl düz ---------- */
export function OrderGame({ level, onDone }: GameProps) {
  const n = Math.min(8, 3 + level);
  const nums = useMemo(() => {
    const mx = [10, 20, 50, 100, 1000][level - 1];
    const s = new Set<number>();
    while (s.size < n) s.add(ri(Math.random, 0, mx));
    return shuffle(Math.random, [...s]);
  }, [n, level]);
  const sorted = useMemo(() => [...nums].sort((a, b) => a - b), [nums]);
  const [done, setDone] = useState<number[]>([]);
  const [bad, setBad] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const tap = (v: number) => {
    if (done.includes(v)) return;
    if (v === sorted[done.length]) {
      sfx.ok();
      const d = [...done, v];
      setDone(d);
      if (d.length === n) setTimeout(() => onDone(Math.max(0.3, 1 - mistakes * 0.15)), 500);
    } else {
      sfx.bad();
      setMistakes((m) => m + 1);
      setBad(v);
      setTimeout(() => setBad(null), 400);
    }
  };
  return (
    <>
      <Card className="mb-4 flex min-h-[64px] flex-wrap items-center justify-center gap-2">
        {done.map((v) => (
          <span key={v} className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xl font-black text-emerald-700">
            {v}
          </span>
        ))}
        {done.length < n && <span className="text-xl font-black text-violet-300">…</span>}
      </Card>
      <div className="grid grid-cols-3 gap-3">
        {nums.map((v) => (
          <button
            key={v}
            disabled={done.includes(v)}
            onClick={() => tap(v)}
            className={`rounded-3xl py-5 text-3xl font-black shadow-[0_5px_0_#ddd6fe] transition ${done.includes(v) ? 'bg-violet-50 text-violet-200' : 'bg-white text-violet-700'} ${bad === v ? 'bk-shake bg-rose-100' : ''}`}
          >
            {v}
          </button>
        ))}
      </div>
    </>
  );
}

/* ---------- Fərqləri tap ---------- */
const DIFF_SET = ['🌳', '🌸', '🍄', '🐞', '🐝', '🌼', '🍀', '🦋', '🐌', '🌻', '🐸', '🍓'];
export function DiffGame({ level, onDone }: GameProps) {
  const { t } = useStore();
  const size = level <= 2 ? 4 : 5;
  const k = Math.min(5, 2 + Math.ceil(level / 2));
  const { top, bottom, diffs } = useMemo(() => {
    const top = Array.from({ length: size * size }, () => pick(Math.random, DIFF_SET));
    const bottom = top.slice();
    const diffs = sample(Math.random, [...top.keys()], k);
    for (const i of diffs) bottom[i] = pick(Math.random, DIFF_SET.filter((x) => x !== top[i]));
    return { top, bottom, diffs: new Set(diffs) };
  }, [size, k]);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [miss, setMiss] = useState(0);
  const [bad, setBad] = useState<number | null>(null);
  const tap = (i: number) => {
    if (found.has(i)) return;
    if (diffs.has(i)) {
      sfx.ok();
      const f = new Set(found).add(i);
      setFound(f);
      if (f.size === diffs.size) setTimeout(() => onDone(Math.max(0.3, 1 - miss * 0.1)), 600);
    } else {
      sfx.bad();
      setMiss((m) => m + 1);
      setBad(i);
      setTimeout(() => setBad(null), 350);
    }
  };
  const grid = (arr: string[], interactive: boolean) => (
    <div className="grid gap-1 rounded-3xl bg-white p-2 shadow-sm" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {arr.map((e, i) => (
        <button
          key={i}
          disabled={!interactive}
          onClick={() => tap(i)}
          className={`grid aspect-square place-items-center rounded-xl text-[min(7.5vw,32px)] ${interactive && found.has(i) ? 'bg-emerald-200 ring-2 ring-emerald-400' : 'bg-lime-50'} ${bad === i ? 'bk-shake bg-rose-100' : ''}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
  return (
    <>
      <div className="mb-2 text-center font-extrabold text-violet-700">
        {t('found')}: {found.size}/{diffs.size}
      </div>
      {grid(top, false)}
      <div className="my-2 text-center text-xl">⬇️</div>
      {grid(bottom, true)}
    </>
  );
}

/* ---------- Şəkildən əşyanı tap ---------- */
const FIND_SET = ['🍎', '🍌', '🍇', '🚗', '⚽', '🎈', '🐱', '🐶', '⭐', '🌙', '🔑', '🎁', '🧸', '✏️', '📚', '🕶️'];
export function FindGame({ level, onDone }: GameProps) {
  const { t } = useStore();
  const size = [4, 5, 5, 6, 7][level - 1];
  const k = level <= 2 ? 2 : 3;
  const { cells, target } = useMemo(() => {
    const target = pick(Math.random, FIND_SET);
    const others = FIND_SET.filter((x) => x !== target);
    const cells = Array.from({ length: size * size }, () => pick(Math.random, others));
    for (const i of sample(Math.random, [...cells.keys()], k)) cells[i] = target;
    return { cells, target };
  }, [size, k]);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [miss, setMiss] = useState(0);
  const tap = (i: number) => {
    if (found.has(i)) return;
    if (cells[i] === target) {
      sfx.ok();
      const f = new Set(found).add(i);
      setFound(f);
      if (f.size === k) setTimeout(() => onDone(Math.max(0.3, 1 - miss * 0.12)), 500);
    } else {
      sfx.bad();
      setMiss((m) => m + 1);
    }
  };
  return (
    <>
      <Card className="mb-3 flex items-center justify-center gap-3">
        <span className="font-extrabold text-slate-700">{t('h_find')}</span>
        <span className="text-5xl">{target}</span>
        <span className="font-black text-violet-600">
          {found.size}/{k}
        </span>
      </Card>
      <div className="grid gap-1 rounded-3xl bg-white p-2 shadow-sm" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {cells.map((e, i) => (
          <button key={i} onClick={() => tap(i)} className={`grid aspect-square place-items-center rounded-xl text-[min(7vw,30px)] ${found.has(i) ? 'bg-amber-200 ring-2 ring-amber-400' : 'bg-sky-50'}`}>
            {e}
          </button>
        ))}
      </div>
    </>
  );
}

/* ---------- Labirint ---------- */
type Cell = { r: number; c: number };
function makeMaze(n: number): boolean[][] {
  // true = divar. Ölçü (2n+1) — DFS ilə həmişə həll olunan labirint
  const N = 2 * n + 1;
  const g = Array.from({ length: N }, () => Array(N).fill(true));
  const stack: Cell[] = [{ r: 1, c: 1 }];
  g[1][1] = false;
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const nb = shuffle(Math.random, [[0, 2], [2, 0], [0, -2], [-2, 0]]).map(([dr, dc]) => ({ r: cur.r + dr, c: cur.c + dc })).filter((p) => p.r > 0 && p.c > 0 && p.r < N - 1 && p.c < N - 1 && g[p.r][p.c]);
    if (!nb.length) {
      stack.pop();
      continue;
    }
    const nx = nb[0];
    g[(cur.r + nx.r) / 2][(cur.c + nx.c) / 2] = false;
    g[nx.r][nx.c] = false;
    stack.push(nx);
  }
  return g;
}
export function shortestMaze(g: boolean[][], from: Cell, to: Cell): number {
  const N = g.length;
  const dist = Array.from({ length: N }, () => Array(N).fill(-1));
  dist[from.r][from.c] = 0;
  const q = [from];
  while (q.length) {
    const p = q.shift()!;
    if (p.r === to.r && p.c === to.c) return dist[p.r][p.c];
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const r = p.r + dr, c = p.c + dc;
      if (r >= 0 && c >= 0 && r < N && c < N && !g[r][c] && dist[r][c] < 0) {
        dist[r][c] = dist[p.r][p.c] + 1;
        q.push({ r, c });
      }
    }
  }
  return -1;
}
export function MazeGame({ level, onDone }: GameProps) {
  const n = [3, 4, 5, 6, 7][level - 1];
  const g = useMemo(() => makeMaze(n), [n]);
  const N = g.length;
  const goal = { r: N - 2, c: N - 2 };
  const best = useMemo(() => shortestMaze(g, { r: 1, c: 1 }, goal), [g]);
  const [pos, setPos] = useState<Cell>({ r: 1, c: 1 });
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const move = (dr: number, dc: number) => {
    if (won) return;
    const r = pos.r + dr, c = pos.c + dc;
    if (g[r]?.[c] !== false) {
      sfx.bad();
      return;
    }
    sfx.tap();
    setPos({ r, c });
    setMoves((m) => m + 1);
    if (r === goal.r && c === goal.c) {
      setWon(true);
      sfx.win();
      setTimeout(() => onDone(Math.min(1, (best + 2) / (moves + 1))), 600);
    }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const m: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (m[e.key]) move(...m[e.key]);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  // sürüşdürmə jesti
  const [touch, setTouch] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <div
        className="mx-auto grid w-full max-w-sm touch-none overflow-hidden rounded-3xl bg-emerald-900 p-1.5 shadow-sm"
        style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}
        onTouchStart={(e) => setTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          if (!touch) return;
          const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) Math.abs(dx) > Math.abs(dy) ? move(0, Math.sign(dx)) : move(Math.sign(dy), 0);
          setTouch(null);
        }}
      >
        {g.flatMap((row, r) =>
          row.map((wall, c) => (
            <div key={`${r}-${c}`} className={`grid aspect-square place-items-center ${wall ? 'bg-emerald-800' : 'bg-lime-50'}`} style={{ fontSize: `calc(min(100vw - 40px, 384px) / ${N} * 0.75)` }}>
              {pos.r === r && pos.c === c ? '🤖' : r === goal.r && c === goal.c ? '⭐' : ''}
            </div>
          )),
        )}
      </div>
      <div className="mx-auto mt-4 grid w-56 grid-cols-3 gap-2">
        <span />
        <Btn kind="ghost" className="!text-2xl" onClick={() => move(-1, 0)}>⬆️</Btn>
        <span />
        <Btn kind="ghost" className="!text-2xl" onClick={() => move(0, -1)}>⬅️</Btn>
        <Btn kind="ghost" className="!text-2xl" onClick={() => move(1, 0)}>⬇️</Btn>
        <Btn kind="ghost" className="!text-2xl" onClick={() => move(0, 1)}>➡️</Btn>
      </div>
    </>
  );
}

/* ---------- Sürüşən şəkil puzzle ---------- */
const AZB = '#00b5e2', AZR = '#ef3340', AZG = '#509e2f';
const IMG: string[] = [];
function picture(i: number): string {
  if (IMG[i]) return IMG[i];
  const S = 480;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const x = cv.getContext('2d')!;
  if (i === 0) {
    [AZB, AZR, AZG].forEach((c, k) => {
      x.fillStyle = c;
      x.fillRect(0, (k * S) / 3, S, S / 3);
    });
    const cx = S * 0.46, cy = S / 2, R = S * 0.13;
    x.fillStyle = '#fff';
    x.beginPath();
    x.arc(cx, cy, R, 0, 7);
    x.fill();
    x.fillStyle = AZR;
    x.beginPath();
    x.arc(cx + R * 0.27, cy, R * 0.8, 0, 7);
    x.fill();
    x.fillStyle = '#fff';
    x.beginPath();
    const sx = cx + R * 1.05, ro = R * 0.42, rin = ro * 0.5;
    for (let k = 0; k < 16; k++) {
      const a = (k * Math.PI) / 8 - Math.PI / 2, rr = k % 2 ? rin : ro;
      x.lineTo(sx + rr * Math.cos(a), cy + rr * Math.sin(a));
    }
    x.fill();
  } else if (i === 1) {
    const g = x.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, '#6ec6ff');
    g.addColorStop(1, '#d4f1ff');
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    x.fillStyle = '#ffd23f';
    x.beginPath();
    x.arc(390, 90, 48, 0, 7);
    x.fill();
    x.fillStyle = '#5ec26a';
    x.fillRect(0, 350, S, 130);
    x.fillStyle = '#ffb74d';
    x.fillRect(150, 230, 190, 140);
    x.fillStyle = '#e53935';
    x.beginPath();
    x.moveTo(130, 235);
    x.lineTo(245, 140);
    x.lineTo(360, 235);
    x.fill();
    x.fillStyle = '#795548';
    x.fillRect(220, 290, 50, 80);
    x.fillStyle = '#4fc3f7';
    x.fillRect(170, 260, 40, 40);
    x.fillRect(285, 260, 40, 40);
    x.fillStyle = '#6d4c41';
    x.fillRect(60, 260, 22, 100);
    x.fillStyle = '#2e7d32';
    x.beginPath();
    x.arc(71, 240, 48, 0, 7);
    x.fill();
  } else {
    x.fillStyle = '#bfe9ff';
    x.fillRect(0, 0, S, S);
    ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#3949ab', '#8e24aa'].forEach((c, k) => {
      x.strokeStyle = c;
      x.lineWidth = 22;
      x.beginPath();
      x.arc(240, 420, 200 - k * 22, Math.PI, 0);
      x.stroke();
    });
    x.fillStyle = '#fff';
    [[60, 410], [110, 400], [150, 420], [330, 410], [380, 395], [430, 420]].forEach(([a, b]) => {
      x.beginPath();
      x.arc(a, b, 42, 0, 7);
      x.fill();
    });
    x.fillStyle = '#ffd23f';
    x.beginPath();
    x.arc(80, 80, 40, 0, 7);
    x.fill();
  }
  return (IMG[i] = cv.toDataURL('image/png'));
}
export function SlideGame({ level, onDone }: GameProps) {
  const { t } = useStore();
  const n = level <= 3 ? 3 : 4;
  const shuffles = [10, 25, 60, 50, 120][level - 1];
  const img = useMemo(() => picture(ri(Math.random, 0, 2)), []);
  const [pos, setPos] = useState<number[]>(() => {
    const p = [...Array(n * n - 1).keys(), -1];
    let e = n * n - 1, prev = -1;
    for (let k = 0; k < shuffles; k++) {
      const nb = [e - n, e + n, e % n ? e - 1 : -1, e % n < n - 1 ? e + 1 : -1].filter((x) => x >= 0 && x < n * n && x !== prev);
      const m = pick(Math.random, nb);
      p[e] = p[m];
      p[m] = -1;
      prev = e;
      e = m;
    }
    if (p.every((v, i) => (i === n * n - 1 ? v === -1 : v === i))) {
      const m = n * n - 2;
      p[n * n - 1] = p[m];
      p[m] = -1;
    }
    return p;
  });
  const [moves, setMoves] = useState(0);
  const tap = (tile: number) => {
    const p = pos.indexOf(tile), e = pos.indexOf(-1);
    const adj = Math.abs(p - e) === n || (Math.abs(p - e) === 1 && Math.floor(p / n) === Math.floor(e / n));
    if (!adj) return;
    sfx.tap();
    const np = pos.slice();
    np[e] = tile;
    np[p] = -1;
    setPos(np);
    setMoves(moves + 1);
    if (np.every((v, i) => (i === n * n - 1 ? v === -1 : v === i))) {
      sfx.win();
      setTimeout(() => onDone(Math.min(1, (shuffles * 1.2) / Math.max(1, moves + 1))), 700);
    }
  };
  return (
    <>
      <div className="mb-3 flex items-center justify-center gap-3 font-extrabold text-violet-700">
        <span className="h-14 w-14 rounded-xl bg-cover shadow" style={{ backgroundImage: `url(${img})` }} />
        {t('moves')}: {moves}
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-violet-100 shadow-sm">
        {[...Array(n * n - 1).keys()].map((tile) => {
          const p = pos.indexOf(tile);
          const r = Math.floor(tile / n), c = tile % n;
          return (
            <button
              key={tile}
              onClick={() => tap(tile)}
              className="absolute rounded-lg border-2 border-white/80 bg-no-repeat transition-all duration-150"
              style={{
                width: `${100 / n}%`,
                height: `${100 / n}%`,
                left: `${((p % n) * 100) / n}%`,
                top: `${(Math.floor(p / n) * 100) / n}%`,
                backgroundImage: `url(${img})`,
                backgroundSize: `${n * 100}% ${n * 100}%`,
                backgroundPosition: `${(c * 100) / (n - 1)}% ${(r * 100) / (n - 1)}%`,
              }}
            >
              <b className="absolute left-1 top-0.5 text-xs text-white [text-shadow:0_1px_2px_#000]">{tile + 1}</b>
            </button>
          );
        })}
      </div>
    </>
  );
}
