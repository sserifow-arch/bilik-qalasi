import { useEffect, useMemo, useRef, useState } from 'react';
import type { Question, T3 } from '../lib/types';
import { useProfile, useStore } from '../lib/store';
import { prepare, toTrueFalse, optionCount, type Prepared } from '../engine/select';
import { mulberry32, pick } from '../lib/util';
import { canRead, readAloud, sfx } from '../lib/sound';
import { Btn, Card, Confetti, Screen, TopBar } from './ui';
import { Mascot } from './Mascot';

interface Item {
  p: Prepared;
  tf?: { claim: T3; truth: boolean };
}

export interface QuizResult {
  ok: number;
  n: number;
  sec: number;
}

const isPicture = (s: string) => !/[\p{L}\d]/u.test(s) && [...s].length <= 6;

export function QuizRunner({
  title,
  questions,
  timer = 0,
  tfShare = 0,
  seed,
  onDone,
}: {
  title: string;
  questions: Question[];
  timer?: number;
  /** «doğru/yanlış» formatında verilən sualların payı */
  tfShare?: number;
  seed?: number;
  onDone: (r: QuizResult) => void;
}) {
  const { t, L, lang, answer } = useStore();
  const prof = useProfile();
  const items = useMemo<Item[]>(() => {
    const r = mulberry32(seed ?? Date.now());
    return questions.map((q) => {
      const p = prepare(q, r, optionCount(prof.age));
      if (tfShare && r() < tfShare && q.o.length >= 2) {
        const x = toTrueFalse(q, r);
        return { p, tf: { claim: x.claim, truth: x.truth } };
      }
      return { p };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [okCount, setOk] = useState(0);
  const [left, setLeft] = useState(timer);
  const qStart = useRef(Date.now());
  const total = useRef(0);
  const praise = useMemo(() => pick(Math.random, t('praise').split('|')), [i, t]);

  const it = items[i];
  const q = it.p.q;
  const answered = picked !== null || timedOut;
  const correctIdx = it.tf ? (it.tf.truth ? 0 : 1) : it.p.correct;
  const isOk = picked === correctIdx;

  useEffect(() => {
    qStart.current = Date.now();
    setLeft(timer);
    if (!timer) return;
    const id = setInterval(() => {
      setLeft((x) => {
        if (x <= 1) {
          clearInterval(id);
          setTimedOut(true);
          return 0;
        }
        return x - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [i, timer]);

  useEffect(() => {
    if (!timedOut || picked !== null) return;
    const sec = (Date.now() - qStart.current) / 1000;
    total.current += sec;
    answer(q, false, sec);
    sfx.bad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut]);

  const choose = (k: number) => {
    if (answered) return;
    const sec = (Date.now() - qStart.current) / 1000;
    total.current += sec;
    setPicked(k);
    const ok = k === correctIdx;
    if (ok) {
      sfx.ok();
      setOk((x) => x + 1);
    } else sfx.bad();
    answer(q, ok, sec);
  };

  const next = () => {
    if (i + 1 >= items.length) {
      onDone({ ok: okCount, n: items.length, sec: Math.round(total.current) });
      return;
    }
    setI(i + 1);
    setPicked(null);
    setTimedOut(false);
  };

  // Düz cavabdan sonra avtomatik keçid
  useEffect(() => {
    if (picked === null || !isOk) return;
    const id = setTimeout(next, 1300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  const options: string[] = it.tf ? [t('trueQ'), t('falseQ')] : it.p.options.map(L);
  const allPics = !it.tf && options.every(isPicture);
  const qText = it.tf ? `${L(q.q)}\n→ ${L(it.tf.claim)}` : L(q.q);

  return (
    <Screen>
      <TopBar
        title={title}
        right={
          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-black text-violet-700 shadow-sm">
            {i + 1}/{items.length}
          </span>
        }
      />
      <div className="mb-3 flex gap-1.5">
        {items.map((_, k) => (
          <span key={k} className={`h-2 flex-1 rounded-full ${k < i ? 'bg-violet-400' : k === i ? 'bg-amber-400' : 'bg-violet-100'}`} />
        ))}
      </div>
      {timer > 0 && (
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-violet-100">
          <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${left <= 5 ? 'bg-rose-400' : 'bg-teal-400'}`} style={{ width: `${(left / timer) * 100}%` }} />
        </div>
      )}

      <Card className="bk-pop text-center" key={i}>
        {q.img && <div className={`mb-2 leading-tight ${[...q.img].length > 3 ? 'text-4xl tracking-wider' : 'text-6xl'}`}>{q.img}</div>}
        {it.tf && <div className="mb-1 text-sm font-black uppercase tracking-wide text-teal-600">{t('tfPrompt')}</div>}
        <p className="whitespace-pre-line text-[21px] font-extrabold leading-snug text-slate-800">{qText}</p>
        {canRead(lang) && (
          <button onClick={() => readAloud(qText.replace('→', ''), lang)} className="mt-3 rounded-full bg-violet-50 px-4 py-1.5 text-sm font-extrabold text-violet-700">
            🔊 {t('readAloud')}
          </button>
        )}
      </Card>

      <div className={`mt-4 grid gap-3 ${allPics || it.tf ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {options.map((o, k) => {
          const state = !answered ? '' : k === correctIdx ? 'ok' : k === picked ? 'bad' : 'dim';
          return (
            <button
              key={k}
              disabled={answered}
              onClick={() => choose(k)}
              className={`min-h-[64px] rounded-3xl px-4 py-3.5 text-center font-extrabold shadow-[0_5px_0_#ddd6fe] transition active:translate-y-1 ${allPics ? 'text-5xl' : 'text-lg'} ${
                state === 'ok' ? 'bk-bounce bg-emerald-500 text-white shadow-[0_5px_0_#0f8a5f]' : state === 'bad' ? 'bk-shake bg-rose-500 text-white shadow-[0_5px_0_#b4234a]' : state === 'dim' ? 'bg-white opacity-50' : 'bg-white text-slate-800'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>

      {answered && (
        <Card className="bk-pop mt-4">
          <div className="flex items-start gap-3">
            <Mascot size={58} mood={isOk ? 'cheer' : 'think'} />
            <div className="flex-1">
              <div className={`text-lg font-black ${isOk ? 'text-emerald-600' : 'text-rose-500'}`}>{isOk ? praise : timedOut ? t('timeUp') : t('wrong')}</div>
              {!isOk && (
                <div className="mt-1 font-bold text-slate-700">
                  {t('rightAnswer')}: <span className="text-emerald-600">{it.tf ? (it.tf.truth ? t('trueQ') : t('falseQ')) + ' — ' + L(q.o[q.a]) : L(q.o[q.a])}</span>
                </div>
              )}
              <div className="mt-1 text-[15px] font-semibold text-slate-500">{L(q.e)}</div>
              {!isOk && <div className="mt-1 text-sm font-bold text-violet-500">{t('tryAgainHint')}</div>}
            </div>
          </div>
          {!isOk && (
            <Btn className="mt-3 w-full" onClick={next}>
              {t('next')} →
            </Btn>
          )}
        </Card>
      )}
      {isOk && picked !== null && <Confetti n={14} />}
    </Screen>
  );
}
