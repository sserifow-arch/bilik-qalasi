// content/questions/*.txt → src/data/questions/*.json
// Format: ID|yaş|çətinlik|şəkil|sual az ~ ru ~ en|variant1;variant2;...|izah az ~ ru ~ en
// Birinci variant düzgün cavabdır. Variant "az~ru~en" və ya hər dildə eyni ola bilər.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'content/questions');
const OUT = join(root, 'src/data/questions');
mkdirSync(OUT, { recursive: true });

const tri = (s, where) => {
  const p = s.split('~').map((x) => x.trim());
  if (p.length === 1) return { az: p[0], ru: p[0], en: p[0] };
  if (p.length !== 3 || p.some((x) => !x)) throw new Error(`${where}: 3 dil lazımdır → «${s}»`);
  return { az: p[0], ru: p[1], en: p[2] };
};

const errors = [];
const all = [];
const ids = new Set();
for (const f of readdirSync(SRC).filter((f) => f.endsWith('.txt')).sort()) {
  const cat = basename(f, '.txt');
  const list = [];
  readFileSync(join(SRC, f), 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const where = `${f}:${i + 1}`;
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      try {
        const parts = line.split('|');
        if (parts.length !== 7) throw new Error(`${where}: 7 sahə lazımdır, ${parts.length} var`);
        const [id, ages, d, img, q, opts, e] = parts.map((x) => x.trim());
        if (ids.has(id)) throw new Error(`${where}: təkrar id ${id}`);
        ids.add(id);
        if (!/^[abcd]+$/.test(ages)) throw new Error(`${where}: yaş qrupu səhvdir`);
        const diff = Number(d);
        if (!(diff >= 1 && diff <= 5)) throw new Error(`${where}: çətinlik 1-5 olmalıdır`);
        const options = opts.split(';').map((o) => tri(o, where));
        if (options.length < 2) throw new Error(`${where}: ən azı 2 variant`);
        for (const lang of ['az', 'ru', 'en']) {
          const vals = options.map((o) => o[lang]);
          if (new Set(vals).size !== vals.length) throw new Error(`${where}: ${lang} variantları təkrarlanır`);
        }
        const item = { id, cat, ages: ages.split(''), d: diff, img, q: tri(q, where), o: options, a: 0, e: tri(e, where), pts: diff * 10 };
        list.push(item);
        all.push(item);
      } catch (err) {
        errors.push(err.message);
      }
    });
  writeFileSync(join(OUT, `${cat}.json`), JSON.stringify(list, null, 0) + '\n');
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
const by = (k) => Object.entries(all.reduce((m, q) => ((m[k(q)] = (m[k(q)] ?? 0) + 1), m), {}));
console.log(`Suallar: ${all.length}`);
console.log('Kateqoriya:', by((q) => q.cat).map((x) => x.join('=')).join(', '));
console.log('Çətinlik:', by((q) => q.d).map((x) => x.join('=')).join(', '));
for (const g of 'abcd') console.log(`Yaş ${g}:`, all.filter((q) => q.ages.includes(g)).length);
