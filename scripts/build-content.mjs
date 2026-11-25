import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  buildCandidates,
  englishSection,
  extractDefinitions,
  extractTranslationBlocks,
  posSections,
} from '../src/content/parse-wiktionary.ts';

const WORD_LIMIT = Number(process.argv[2] ?? 1000);
const PACK_LIMIT = Number(process.env.PACK_LIMIT ?? 200);
const RETRIEVED_AT = '2026-11-25T00:00:00Z';
const CACHE = 'content/cache/en_wiktionary/pages';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const cachePath = (title) => path.join(CACHE, `${encodeURIComponent(title)}.json`);
const readCached = async (title) => existsSync(cachePath(title))
  ? JSON.parse(await readFile(cachePath(title), 'utf8'))
  : null;

const words = (await readFile('content/source/google-10000-english-no-swears.txt', 'utf8'))
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .slice(0, WORD_LIMIT);

const retrievedAt = RETRIEVED_AT;
const all = [];
const skipped = [];

for (const [offset, lemma] of words.entries()) {
  const rank = offset + 1;
  const record = await readCached(lemma);
  if (!record) {
    skipped.push({ lemma, reason: 'missing_cache' });
    continue;
  }
  const english = englishSection(record.wikitext);
  const definitions = new Map(posSections(english).map((section) => [section.pos, extractDefinitions(section.body)]));
  const mainBlocks = extractTranslationBlocks(english, record);
  const subRecord = await readCached(`${lemma}/translations`);
  const subBlocks = subRecord ? extractTranslationBlocks(englishSection(subRecord.wikitext), subRecord) : [];
  const subPos = new Set(subBlocks.map((block) => block.pos));
  const blocks = [...mainBlocks.filter((block) => !subPos.has(block.pos)), ...subBlocks];
  all.push(...buildCandidates(lemma, rank, definitions, blocks, retrievedAt, record));
}

const EXCLUDED = new Set(['i', 'are', 'may', 'will', 'that', 'this', 'it', 'by', 'any', 'each']);
const OVERRIDES = {
  page: {
    definitionEn: 'One of the many pieces of paper bound together within a book or similar document.',
    exampleEn: 'This chapter starts on page twelve.',
  },
  new: {
    definitionEn: 'Recently made or created.',
    exampleEn: 'She bought a new laptop yesterday.',
  },
  see: {
    pos: 'verb',
    definitionEn: 'To perceive with the eyes.',
    exampleEn: 'I can see the mountains from here.',
    pt: 'ver',
  },
  can: {
    pos: 'verb',
    definitionEn: 'To be able to.',
    exampleEn: 'She can swim very well.',
    pt: 'poder',
  },
};

const deduped = new Map();
for (const candidate of all) {
  if (EXCLUDED.has(candidate.lemma)) continue;
  const override = OVERRIDES[candidate.lemma];
  if (override) {
    if (override.pos && candidate.pos !== override.pos) continue;
    Object.assign(candidate, override);
  }
  const previous = deduped.get(candidate.key);
  if (!previous || (candidate.status === 'ok' && previous.status !== 'ok')) deduped.set(candidate.key, candidate);
}

const toItem = (candidate) => ({
  id: candidate.key,
  rank: candidate.rank,
  lemma: candidate.lemma,
  pos: candidate.pos,
  sense_index: candidate.senseIndex,
  definition_en: candidate.definitionEn,
  example_en: candidate.exampleEn,
  examples_en: candidate.examplesEn,
  translation_ptbr: candidate.pt ?? '',
  translation_candidates: candidate.ptCandidates,
  status: candidate.status,
  match_confidence: candidate.matchConfidence,
  source_id: candidate.sourceId,
  source_url: candidate.sourceUrl,
  source_page: candidate.sourcePage,
  revid: candidate.revid,
  rev_timestamp: candidate.revTimestamp,
  license: candidate.license,
  retrieved_at: candidate.retrievedAt,
  attribution: `Wiktionary (en), ${candidate.sourcePage}, rev ${candidate.revid}, CC BY-SA 4.0 (texto extraido e adaptado)`,
});

const wordCount = (value) => value.trim().split(/\s+/).filter((token) => /[A-Za-z]/.test(token)).length;
const isUsefulDefinition = (value) => Boolean(value)
  && value.trim().length >= 12
  && wordCount(value) >= 3
  && !/^[.;]/.test(value.trim());
const isUsefulExample = (value) => Boolean(value)
  && value.trim().length >= 10
  && wordCount(value) >= 3;

const minConfidence = process.env.MIN_CONFIDENCE === 'high' ? 'high' : 'medium';
const confidenceScore = (candidate) => candidate.matchConfidence === 'high' ? 1 : 0;
const bestByLemma = new Map();
for (const candidate of deduped.values()) {
  const current = bestByLemma.get(candidate.lemma);
  const score = [
    candidate.status === 'pending_function_word' ? 2 : candidate.status === 'ok' ? 1 : 0,
    confidenceScore(candidate),
    candidate.pos === 'noun' ? 1 : 0,
  ];
  const currentScore = current ? [
    current.status === 'pending_function_word' ? 2 : current.status === 'ok' ? 1 : 0,
    confidenceScore(current),
    current.pos === 'noun' ? 1 : 0,
  ] : [-1, -1, -1];
  if (score.join(',') > currentScore.join(',')) bestByLemma.set(candidate.lemma, candidate);
}
const approved = [...bestByLemma.values()]
  .filter((candidate) => /^[a-z]{2,}$/.test(candidate.lemma))
  .filter((candidate) => candidate.status === 'ok')
  .filter((candidate) => isUsefulDefinition(candidate.definitionEn) && isUsefulExample(candidate.exampleEn))
  .filter((candidate) => minConfidence === 'medium' || candidate.matchConfidence === 'high')
  .sort((left, right) => left.rank - right.rank)
  .slice(0, PACK_LIMIT)
  .map(toItem);

const pending = [...deduped.values()]
  .filter((candidate) => candidate.status !== 'ok')
  .sort((left, right) => left.rank - right.rank)
  .map(toItem);

const pack = {
  version: `wiktionary-${retrievedAt.slice(0, 10)}.3`,
  built_at: retrievedAt,
  checksum: sha256(JSON.stringify(approved)),
  source: {
    wordlist: 'first20hours/google-10000-english (no-swears)',
    translations: 'en.wiktionary.org',
    examples: 'en.wiktionary.org',
    license: 'CC-BY-SA-4.0',
    word_limit: WORD_LIMIT,
    pack_limit: PACK_LIMIT,
  },
  items: approved,
};

await writeFile('src/content/pack.json', `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
await writeFile('content/review-queue.json', `${JSON.stringify({ built_at: retrievedAt, items: pending, skipped }, null, 2)}\n`, 'utf8');

const credits = [
  '# Creditos de conteudo',
  '',
  'Definicoes e exemplos extraidos da English Wiktionary sob CC BY-SA 4.0.',
  'Texto original extraido e adaptado: marcadores de classe gramatical e templates foram removidos.',
  'As traducoes em portugues sao metadados opcionais e nao aparecem no cartao.',
  'Cada item registra a pagina, a revisao fixa (oldid) e a licenca em `src/content/pack.json`.',
  '',
  ...approved.map((item) => `- ${item.lemma} (${item.pos}): ${item.attribution} - ${item.source_url}`),
  '',
];
await writeFile('content/CREDITS.md', credits.join('\n'), 'utf8');

console.log(`lemas processados: ${words.length - skipped.length}/${words.length}`);
console.log(`candidatos: ${deduped.size} | aprovados: ${approved.length} | pendentes: ${pending.length}`);
console.log(`checksum: ${pack.checksum}`);
