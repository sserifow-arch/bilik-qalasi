import { useMemo, useState, type ReactNode } from 'react';
import { pick, sample, shuffle } from '../lib/util';
import { sfx } from '../lib/sound';
import { Card } from '../components/ui';
import type { GameProps } from './pairs';

interface Round {
  show: ReactNode;
  options: string[];
  correct: number;
}

function Rounds({ make, rounds = 5, onDone }: { make: () => Round; rounds?: number; onDone: (s: number) => void }) {
  const list = useMemo(() => Array.from({ length: rounds }, make), [rounds]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [ok, setOk] = useState(0);
  const r = list[i];
  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const good = k === r.correct;
    good ? sfx.ok() : sfx.bad();
    const nok = ok + (good ? 1 : 0);
    setOk(nok);
    setTimeout(() => {
      if (i + 1 >= rounds) onDone(nok / rounds);
      else {
        setI(i + 1);
        setPicked(null);
      }
    }, good ? 700 : 1200);
  };
  return (
    <>
      <div className="mb-3 flex gap-1.5">
        {list.map((_, k) => (
          <span key={k} className={`h-2 flex-1 rounded-full ${k < i ? 'bg-violet-400' : k === i ? 'bg-amber-400' : 'bg-violet-100'}`} />
        ))}
      </div>
      <Card className="bk-pop grid min-h-[180px] place-items-center" key={i}>
        {r.show}
      </Card>
      <div className={`mt-4 grid gap-3 ${r.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {r.options.map((o, k) => (
          <button
            key={k}
            onClick={() => choose(k)}
            className={`rounded-3xl py-4 text-5xl shadow-[0_5px_0_#ddd6fe] transition active:translate-y-1 ${
              picked === null ? 'bg-white' : k === r.correct ? 'bk-bounce bg-emerald-200' : k === picked ? 'bk-shake bg-rose-200' : 'bg-white opacity-50'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </>
  );
}

const SHADOW = ['🐘', '🦒', '🐇', '🐢', '🦋', '🐟', '🦆', '🐈', '🐕', '🐎', '🦀', '🐌', '🚗', '✈️', '🚲', '🎸', '☂️', '🔑', '🍐', '🍄'];
/** Kölgəyə uyğun şəkli tap */
export function ShadowGame({ level, onDone }: GameProps) {
  const k = level <= 1 ? 3 : 4;
  return (
    <Rounds
      onDone={onDone}
      make={() => {
        const opts = sample(Math.random, SHADOW, k);
        const correct = Math.floor(Math.random() * k);
        return { show: <span className="bk-silhouette text-[110px] leading-none">{opts[correct]}</span>, options: opts, correct };
      }}
    />
  );
}

const ODD_PAIRS: [string, string][] = [
  ['🔺', '🔻'], ['🔴', '🟠'], ['⬛', '⬜'], ['🟦', '🟪'], ['⭐', '🌟'], ['🍏', '🍎'], ['🟢', '🟩'], ['🔶', '🔷'], ['➡️', '⬅️'], ['🌕', '🌑'], ['😀', '😃'], ['🐟', '🐠'],
];
/** Artıq fiquru tap: çətinlik artdıqca fərq kiçilir və variant çoxalır */
export function OddGame({ level, onDone }: GameProps) {
  const n = Math.min(6, 3 + Math.ceil(level / 2));
  const pairs = level <= 2 ? ODD_PAIRS.slice(0, 6) : ODD_PAIRS;
  return (
    <Rounds
      onDone={onDone}
      make={() => {
        const [a, b] = shuffle(Math.random, pick(Math.random, pairs));
        const correct = Math.floor(Math.random() * n);
        const options = Array.from({ length: n }, (_, i) => (i === correct ? b : a));
        return { show: <span className="text-6xl">🔍</span>, options, correct };
      }}
    />
  );
}

const SYM_SETS = [['🔴', '🟢', '🔵'], ['🍎', '🍌', '🍇'], ['🐶', '🐱', '🐰'], ['⭐', '🌙', '☀️'], ['🔺', '🟦', '⚪'], ['🚗', '🚲', '✈️']];
/** Çatışmayan hissə: 3×3 cədvəldə hər sətir və sütunda simvollar bir dəfə olur */
export function MissingGame({ level, onDone }: GameProps) {
  return (
    <Rounds
      onDone={onDone}
      make={() => {
        const s = shuffle(Math.random, pick(Math.random, SYM_SETS));
        const shift = level >= 3 ? pick(Math.random, [1, 2]) : 1;
        const grid = [0, 1, 2].map((r) => [0, 1, 2].map((c) => s[(c + r * shift) % 3]));
        const hole = Math.floor(Math.random() * 9);
        const ans = grid[Math.floor(hole / 3)][hole % 3];
        const extra = pick(Math.random, ['🟡', '🍓', '🐸', '🌈', '🔷', '🛵'].filter((x) => !s.includes(x)));
        const options = shuffle(Math.random, [...s, ...(level >= 2 ? [extra] : [])]);
        return {
          show: (
            <div className="grid grid-cols-3 gap-2">
              {grid.flat().map((v, i) => (
                <span key={i} className={`grid h-16 w-16 place-items-center rounded-2xl text-4xl ${i === hole ? 'bg-amber-100 ring-4 ring-amber-300' : 'bg-violet-50'}`}>
                  {i === hole ? '❓' : v}
                </span>
              ))}
            </div>
          ),
          options,
          correct: options.indexOf(ans),
        };
      }}
    />
  );
}
