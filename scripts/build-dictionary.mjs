import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import {
  cleanDictionarySenses,
  inferDictionaryPos,
  shortGloss,
  weightForRank,
} from '../src/content/dictionary.ts';

const RETRIEVED_AT = '2026-11-25T00:00:00Z';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const rawText = await readFile('references/dictionary_arrays.json', 'utf8');
const groups = JSON.parse(rawText);
const wordlist = (await readFile('content/source/google-10000-english-no-swears.txt', 'utf8'))
  .split('\n')
  .map((line) => line.trim().toLowerCase())
  .filter(Boolean);
const ranks = new Map(wordlist.map((word, index) => [word, index + 1]));

const items = [];
const review = [];
const seen = new Set();

for (const group of groups) {
  for (const [key, raw] of Object.entries(group)) {
    const lemma = key.toLowerCase();
    if (seen.has(lemma)) continue;
    seen.add(lemma);
    const senses = cleanDictionarySenses(raw);
    if (senses.length === 0) {
      review.push({ id: `EnglishDictionary|${lemma}`, lemma, raw, reason: 'no_clean_sense' });
      continue;
    }
    const frequencyRank = ranks.get(lemma) ?? null;
    const rank = frequencyRank ?? 1_000_000 + items.length;
    items.push({
      id: `EnglishDictionary|${lemma}`,
      rank,
      frequency_rank: frequencyRank,
      weight: weightForRank(frequencyRank),
      lemma,
      pos: inferDictionaryPos(raw),
      sense_index: 'all',
      definition_en: senses.join('\n'),
      prompt_en: shortGloss(senses),
      gloss_en: shortGloss(senses),
      example_en: null,
      examples_en: [],
      translation_ptbr: '',
      status: 'ok',
      match_confidence: 'high',
      source_id: 'EnglishDictionary',
      source_url: '',
      source_page: '',
      revid: 0,
      rev_timestamp: '',
      license: '',
      retrieved_at: RETRIEVED_AT,
      attribution: '',
      translation_candidates: [],
    });
  }
}

items.sort((left, right) => left.rank - right.rank || left.lemma.localeCompare(right.lemma));
review.sort((left, right) => left.lemma.localeCompare(right.lemma));

const pack = {
  version: 'EnglishDictionary-2026-11-25.1',
  built_at: RETRIEVED_AT,
  checksum: sha256(JSON.stringify(items)),
  source: {
    wordlist: 'content/source/google-10000-english-no-swears.txt',
    translations: 'local manual template',
    examples: 'Wiktionary cache when available',
    license: '',
    word_limit: wordlist.length,
    pack_limit: items.length,
    primary_source: 'EnglishDictionary',
    validation_source: 'Wiktionary',
    entry_count: items.length,
    frequency_weighted: true,
  },
  items,
};

await writeFile('content/generated/EnglishDictionary.json', `${JSON.stringify(groups, null, 2)}\n`, 'utf8');
await writeFile('src/content/pack.json', `${JSON.stringify(pack)}\n`, 'utf8');
await writeFile('content/review-queue.json', `${JSON.stringify({ built_at: RETRIEVED_AT, items: review }, null, 2)}\n`, 'utf8');
await writeFile('content/CREDITS.md', 'No attribution is displayed in the app.\n', 'utf8');
await writeFile('content/translations/pt-br.template.json', `${JSON.stringify({
  version: pack.version,
  items: [],
}, null, 2)}\n`, 'utf8');

console.log(`entradas: ${seen.size} | jogaveis: ${items.length} | revisao: ${review.length}`);
console.log(`frequencia conhecida: ${items.filter((item) => item.frequency_rank !== null).length}`);
console.log(`checksum: ${pack.checksum}`);
console.log(`raw sha256: ${sha256(rawText)}`);
console.log(`paridade raw: ${sha256(await readFile('content/generated/EnglishDictionary.json', 'utf8')) === sha256(`${JSON.stringify(groups, null, 2)}\n`)}`);
