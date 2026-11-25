import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const API = 'https://en.wiktionary.org/w/api.php';
const UA = 'WordpetContent/0.1 (educational vocabulary pipeline; contact: local-dev)';
const LIMIT = Number(process.argv[2] ?? 200);
const BATCH = 50;
const CACHE = 'content/cache/en_wiktionary/pages';
const WORDLIST = 'content/source/google-10000-english-no-swears.txt';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const cachePath = (title) => path.join(CACHE, `${encodeURIComponent(title)}.json`);

const fetchTitles = async (titles) => {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'revisions',
    rvprop: 'content|ids|timestamp',
    rvslots: 'main',
    maxlag: '5',
    redirects: '1',
    titles: titles.join('|'),
  });

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(`${API}?${params}`, { headers: { 'User-Agent': UA } });
    const raw = await response.text();
    if (response.status === 429 || /too many requests/i.test(raw)) {
      const retryAfter = Number(response.headers.get('retry-after'));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5000 * 2 ** (attempt - 1);
      console.log(`rate limit (${response.status}), aguardando ${wait}ms...`);
      await sleep(wait + Math.floor(Math.random() * 1000));
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${raw.slice(0, 200)}`);
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new Error(`resposta nao-JSON: ${raw.slice(0, 200)}`);
    }
    if (!json.query?.pages) throw new Error(`resposta sem query.pages: ${raw.slice(0, 200)}`);
    return { pages: json.query.pages, redirects: json.query.redirects ?? [] };
  }
  throw new Error('limite de tentativas excedido');
};

const savePage = async (page) => {
  const revision = page.revisions?.[0];
  if (!revision) return false;
  const wikitext = revision.slots?.main?.content;
  if (typeof wikitext !== 'string') return false;
  const record = {
    title: page.title,
    revid: revision.revids ?? revision.revid,
    rev_timestamp: revision.timestamp,
    source_page: page.title,
    wikitext,
    wikitext_sha256: sha256(wikitext),
  };
  await writeFile(cachePath(page.title), JSON.stringify(record), 'utf8');
  return true;
};

const fetchMissing = async (titles, label) => {
  const missing = titles.filter((title) => !existsSync(cachePath(title)));
  console.log(`${label}: ${titles.length - missing.length} em cache, ${missing.length} para buscar`);
  for (let index = 0; index < missing.length; index += BATCH) {
    const batch = missing.slice(index, index + BATCH);
    const { pages, redirects } = await fetchTitles(batch);
    const aliases = new Map(redirects.map((entry) => [entry.to, entry.from]));
    let saved = 0;
    for (const page of pages) {
      if (await savePage(page)) saved += 1;
      const alias = aliases.get(page.title);
      if (alias && existsSync(cachePath(page.title)) && !existsSync(cachePath(alias))) {
        await writeFile(cachePath(alias), await readFile(cachePath(page.title)));
      }
    }
    console.log(`${label}: lote ${index / BATCH + 1} salvo (${saved}/${batch.length})`);
    await sleep(3000);
  }
};

await mkdir(CACHE, { recursive: true });
const words = (await readFile(WORDLIST, 'utf8')).split('\n').map((line) => line.trim()).filter(Boolean).slice(0, LIMIT);
await fetchMissing(words, 'lemas');

const missingLemmas = words.filter((word) => !existsSync(cachePath(word)));
const capitalized = missingLemmas.map((word) => word[0].toUpperCase() + word.slice(1));
if (capitalized.length > 0) {
  await fetchMissing(capitalized, 'lemas capitalizados');
  for (const [index, word] of missingLemmas.entries()) {
    const variant = capitalized[index];
    if (existsSync(cachePath(variant)) && !existsSync(cachePath(word))) {
      await writeFile(cachePath(word), await readFile(cachePath(variant)));
    }
  }
}

const subpages = new Set();
for (const word of words) {
  const file = cachePath(word);
  if (!existsSync(file)) continue;
  const record = JSON.parse(await readFile(file, 'utf8'));
  if (/\{\{\s*see translation subpage/i.test(record.wikitext)) subpages.add(`${word}/translations`);
}
console.log(`subpaginas de traducao detectadas: ${subpages.size}`);
await fetchMissing([...subpages], 'traducoes');
console.log('concluido');
