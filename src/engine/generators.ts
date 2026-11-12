import type { AgeGroup, Category, Question, T3 } from '../lib/types';
import { nearNumbers, pick, ri, sample, shuffle, type Rng } from '../lib/util';

const t = (az: string, ru: string, en: string): T3 => ({ az, ru, en });
const same = (s: string | number): T3 => ({ az: String(s), ru: String(s), en: String(s) });
let seq = 0;
const mk = (cat: Category, d: number, img: string, q: T3, o: T3[], e: T3): Question => ({
  id: `gen:${cat}:${++seq}`,
  cat,
  ages: ['a', 'b', 'c', 'd'],
  d,
  img,
  q,
  o,
  a: 0,
  e,
  pts: d * 10,
  gen: true,
});

const EMO = ['🍎', '⭐', '🐤', '🎈', '🍓', '🐟', '🌼', '🚗', '🧁', '🐞'];

/** Riyaziyyat: çətinliyə görə sayma, toplama, çıxma, vurma, bölmə, müqayisə, buraxılmış ədəd */
export function genMath(r: Rng, d: number): Question {
  const kinds: string[] =
    d <= 1 ? ['count', 'add1'] : d === 2 ? ['add', 'sub', 'compare', 'count'] : d === 3 ? ['add', 'sub', 'mul', 'missing', 'compare'] : d === 4 ? ['mul', 'div', 'missing', 'mixed'] : ['div', 'mixed', 'missing', 'square'];
  const k = pick(r, kinds);
  if (k === 'count') {
    const n = ri(r, 2, d <= 1 ? 6 : 10);
    const e = pick(r, EMO);
    return mk('math', d, e.repeat(Math.min(n, 10)), t('Neçə dənədir?', 'Сколько здесь?', 'How many are there?'), nearNumbers(r, n, 4, 2, 1).map(same), t(`Say: ${n}.`, `Считаем: ${n}.`, `Count them: ${n}.`));
  }
  if (k === 'compare') {
    const mx = d <= 2 ? 20 : 100;
    const nums = new Set<number>();
    while (nums.size < 4) nums.add(ri(r, 0, mx));
    const a = [...nums];
    const big = r() < 0.6;
    const c = big ? Math.max(...a) : Math.min(...a);
    return mk('math', d, '🔢', big ? t('Hansı ədəd ən böyükdür?', 'Какое число самое большое?', 'Which number is the biggest?') : t('Hansı ədəd ən kiçikdir?', 'Какое число самое маленькое?', 'Which number is the smallest?'), [c, ...a.filter((x) => x !== c)].map(same), same(`${c}`));
  }
  let expr = '';
  let ans = 0;
  if (k === 'add1') {
    const a = ri(r, 1, 4), b = ri(r, 1, 4);
    expr = `${a} + ${b}`;
    ans = a + b;
  } else if (k === 'add') {
    const mx = d <= 2 ? 20 : 100;
    const a = ri(r, 1, mx - 1), b = ri(r, 1, mx - a);
    expr = `${a} + ${b}`;
    ans = a + b;
  } else if (k === 'sub') {
    const mx = d <= 2 ? 20 : 100;
    const a = ri(r, 3, mx), b = ri(r, 1, a - 1);
    expr = `${a} − ${b}`;
    ans = a - b;
  } else if (k === 'mul') {
    const m = d <= 3 ? 5 : 10;
    const a = ri(r, 2, m), b = ri(r, 2, m);
    expr = `${a} × ${b}`;
    ans = a * b;
  } else if (k === 'div') {
    const b = ri(r, 2, d <= 4 ? 9 : 12), q = ri(r, 2, d <= 4 ? 9 : 12);
    expr = `${b * q} : ${b}`;
    ans = q;
  } else if (k === 'square') {
    const a = ri(r, 2, 15);
    expr = `${a}²`;
    ans = a * a;
  } else if (k === 'mixed') {
    const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 1, 20);
    expr = `${a} × ${b} + ${c}`;
    ans = a * b + c;
  } else {
    // missing
    const tp = ri(r, 0, 2);
    if (tp === 0) {
      const a = ri(r, 2, 40), b = ri(r, 2, 40);
      expr = `${a} + ? = ${a + b}`;
      ans = b;
    } else if (tp === 1) {
      const a = ri(r, 2, 9), b = ri(r, 2, 9);
      expr = `? × ${b} = ${a * b}`;
      ans = a;
    } else {
      const a = ri(r, 20, 90), b = ri(r, 2, a - 1);
      expr = `${a} − ? = ${a - b}`;
      ans = b;
    }
    return mk('math', d, '🧮', t(`Buraxılmış ədədi tap: ${expr}`, `Найди пропущенное число: ${expr}`, `Find the missing number: ${expr}`), nearNumbers(r, ans, 4, Math.max(3, Math.round(ans / 5)), 0).map(same), same(`? = ${ans}`));
  }
  return mk('math', d, '🧮', t(`${expr} = ?`, `${expr} = ?`, `${expr} = ?`), nearNumbers(r, ans, 4, Math.max(3, Math.round(ans / 6)), 0).map(same), same(`${expr} = ${ans}`));
}

/** Ədədi ardıcıllıq */
export function genSequence(r: Rng, d: number): Question {
  const len = 4;
  let arr: number[] = [];
  let rule: T3;
  const type = d <= 2 ? 'add' : d === 3 ? pick(r, ['add', 'sub']) : pick(r, ['add', 'sub', 'mul', 'grow']);
  if (type === 'add') {
    const s = d <= 2 ? ri(r, 1, 3) : ri(r, 3, 12);
    const a = ri(r, 0, 20);
    for (let i = 0; i <= len; i++) arr.push(a + i * s);
    rule = t(`Hər dəfə +${s}.`, `Каждый раз +${s}.`, `Add ${s} each time.`);
  } else if (type === 'sub') {
    const s = ri(r, 2, 9);
    const a = ri(r, s * len + 1, s * len + 40);
    for (let i = 0; i <= len; i++) arr.push(a - i * s);
    rule = t(`Hər dəfə −${s}.`, `Каждый раз −${s}.`, `Subtract ${s} each time.`);
  } else if (type === 'mul') {
    const s = pick(r, [2, 3]);
    const a = ri(r, 1, 4);
    for (let i = 0; i <= len; i++) arr.push(a * s ** i);
    rule = t(`Hər dəfə ×${s}.`, `Каждый раз ×${s}.`, `Multiply by ${s} each time.`);
  } else {
    const a = ri(r, 1, 6);
    arr = [a];
    for (let i = 1; i <= len; i++) arr.push(arr[i - 1] + i);
    rule = t('Fərq hər dəfə 1 artır: +1, +2, +3, +4.', 'Разница растёт: +1, +2, +3, +4.', 'The step grows: +1, +2, +3, +4.');
  }
  const ans = arr[len];
  return mk('logic', d, '🔢', t(`Sonra nə gəlir? ${arr.slice(0, len).join(', ')}, ?`, `Что дальше? ${arr.slice(0, len).join(', ')}, ?`, `What comes next? ${arr.slice(0, len).join(', ')}, ?`), nearNumbers(r, ans, 4, 4, 0).map(same), rule);
}

const PAT = [['🍎', '🍌', '🍇'], ['🔴', '🔵', '🟢'], ['⭐', '🌙', '☀️'], ['🐶', '🐱', '🐰'], ['🟨', '🟥', '🟦'], ['🚗', '🚌', '🚲'], ['🌸', '🍀', '🍄']];
/** Şəkil ardıcıllığı */
export function genPattern(r: Rng, d: number): Question {
  const s = shuffle(r, pick(r, PAT));
  const unit = d <= 1 ? [0, 1] : d <= 2 ? pick(r, [[0, 1], [0, 0, 1], [0, 1, 1]]) : pick(r, [[0, 1, 2], [0, 0, 1], [0, 1, 1, 2], [0, 1, 2, 1]]);
  const n = Math.max(4, unit.length * 2 + ri(r, 0, unit.length - 1));
  const items = Array.from({ length: n }, (_, i) => s[unit[i % unit.length]]);
  const ans = s[unit[n % unit.length]];
  return mk('logic', d, items.join('') + '❓', t('Sonra hansı şəkil gəlir?', 'Какая картинка будет дальше?', 'Which picture comes next?'), [ans, ...s.filter((x) => x !== ans), pick(r, ['🎈', '🧸', '⚽'])].map(same), t('Naxış təkrarlanır.', 'Узор повторяется.', 'The pattern repeats.'));
}

const GR: Record<string, string[]> = {
  fruit: ['🍎', '🍌', '🍇', '🍐', '🍒', '🍑', '🍓', '🍍'],
  animal: ['🐶', '🐱', '🐰', '🐻', '🦁', '🐸', '🐮', '🐷'],
  vehicle: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚀', '🚁', '⛵'],
  clothes: ['👕', '👖', '🧦', '🧢', '👗', '🧤'],
  shape: ['🔺', '🟥', '🔵', '🔶', '⬛', '🟢'],
};
const GR_NAME: Record<string, T3> = {
  fruit: t('meyvədir', 'фрукты', 'fruit'),
  animal: t('heyvandır', 'животные', 'animals'),
  vehicle: t('nəqliyyatdır', 'транспорт', 'vehicles'),
  clothes: t('geyimdir', 'одежда', 'clothes'),
  shape: t('fiqurdur', 'фигуры', 'shapes'),
};
/** Artıq olanı tap */
export function genOdd(r: Rng, d: number): Question {
  const [a, b] = sample(r, Object.keys(GR), 2);
  const odd = pick(r, GR[b]);
  const rest = sample(r, GR[a], 3);
  return mk('logic', d, '🤔', t('Hansı artıqdır?', 'Что здесь лишнее?', 'Which one does not belong?'), [odd, ...rest].map(same), t(`Digərləri ${GR_NAME[a].az}.`, `Остальные — ${GR_NAME[a].ru}.`, `The others are ${GR_NAME[a].en}.`));
}

const DAYS: T3[] = [t('Bazar ertəsi', 'Понедельник', 'Monday'), t('Çərşənbə axşamı', 'Вторник', 'Tuesday'), t('Çərşənbə', 'Среда', 'Wednesday'), t('Cümə axşamı', 'Четверг', 'Thursday'), t('Cümə', 'Пятница', 'Friday'), t('Şənbə', 'Суббота', 'Saturday'), t('Bazar', 'Воскресенье', 'Sunday')];
const MONTHS: T3[] = [t('Yanvar', 'Январь', 'January'), t('Fevral', 'Февраль', 'February'), t('Mart', 'Март', 'March'), t('Aprel', 'Апрель', 'April'), t('May', 'Май', 'May'), t('İyun', 'Июнь', 'June'), t('İyul', 'Июль', 'July'), t('Avqust', 'Август', 'August'), t('Sentyabr', 'Сентябрь', 'September'), t('Oktyabr', 'Октябрь', 'October'), t('Noyabr', 'Ноябрь', 'November'), t('Dekabr', 'Декабрь', 'December')];
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Həftənin günləri və aylar */
export function genTime(r: Rng, d: number): Question {
  if (d <= 2 || r() < 0.5) {
    const i = ri(r, 0, 6);
    const shift = d <= 2 ? 1 : ri(r, 2, 4) * (r() < 0.5 ? 1 : -1);
    const ans = mod(i + shift, 7);
    const opts = [ans, ...sample(r, [0, 1, 2, 3, 4, 5, 6].filter((x) => x !== ans), 3)].map((x) => DAYS[x]);
    const q =
      shift === 1
        ? t(`Bu gün — ${DAYS[i].az}. Sabah hansı gündür?`, `Сегодня — ${DAYS[i].ru.toLowerCase()}. Какой день завтра?`, `Today is ${DAYS[i].en}. What day is tomorrow?`)
        : shift > 0
          ? t(`Bu gün — ${DAYS[i].az}. ${shift} gün sonra hansı gün olacaq?`, `Сегодня — ${DAYS[i].ru.toLowerCase()}. Какой день будет через ${shift} дня?`, `Today is ${DAYS[i].en}. What day will it be in ${shift} days?`)
          : t(`Bu gün — ${DAYS[i].az}. ${-shift} gün əvvəl hansı gün idi?`, `Сегодня — ${DAYS[i].ru.toLowerCase()}. Какой день был ${-shift} дня назад?`, `Today is ${DAYS[i].en}. What day was it ${-shift} days ago?`);
    return mk('time', d, '📅', q, opts, t('Həftədə 7 gün var, günlər dövrə vurur.', 'В неделе 7 дней, они идут по кругу.', 'A week has 7 days that go round in a circle.'));
  }
  const m = ri(r, 0, 11);
  const next = r() < 0.5;
  const ans = mod(m + (next ? 1 : -1), 12);
  const opts = [ans, ...sample(r, [...Array(12).keys()].filter((x) => x !== ans), 3)].map((x) => MONTHS[x]);
  return mk('time', d, '🗓️', next ? t(`${MONTHS[m].az} ayından sonra hansı ay gəlir?`, `Какой месяц идёт после месяца «${MONTHS[m].ru}»?`, `Which month comes after ${MONTHS[m].en}?`) : t(`${MONTHS[m].az} ayından əvvəl hansı ay gəlir?`, `Какой месяц идёт перед месяцем «${MONTHS[m].ru}»?`, `Which month comes before ${MONTHS[m].en}?`), opts, t('İldə 12 ay var.', 'В году 12 месяцев.', 'There are 12 months in a year.'));
}

/** Kateqoriyaya uyğun avtomatik sual (yoxdursa null) */
export function generate(cat: Category, r: Rng, d: number, _g?: AgeGroup): Question | null {
  if (cat === 'math') return genMath(r, d);
  if (cat === 'time') return genTime(r, d);
  if (cat === 'logic') return pick(r, [genSequence, genPattern, genOdd])(r, d);
  return null;
}
