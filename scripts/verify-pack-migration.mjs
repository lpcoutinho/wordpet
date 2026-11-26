import assert from 'node:assert/strict';

globalThis.self = { addEventListener() {} };

const sqlite3Module = await import('@sqlite.org/sqlite-wasm');
const { SCHEMA, initPack } = await import('../src/db.worker.ts');
const sqlite3 = await sqlite3Module.default();
const db = new sqlite3.oo1.DB(':memory:');
db.exec({ sql: SCHEMA });

const item = (exampleEn) => ({
  id: 'EnglishDictionary|house',
  rank: 12,
  frequency_rank: 12,
  weight: 0.9,
  lemma: 'house',
  pos: 'noun',
  sense_index: 'all',
  definition_en: 'A building for people to live in.',
  prompt_en: 'A building for people to live in.',
  gloss_en: 'A building for people to live in.',
  example_en: exampleEn,
  examples_en: exampleEn ? [exampleEn] : [],
  translation_ptbr: '',
  status: 'ok',
  match_confidence: 'high',
  source_id: 'EnglishDictionary',
  source_url: '',
  source_page: '',
  revid: 0,
  rev_timestamp: '',
  license: '',
  retrieved_at: '2026-11-25T00:00:00Z',
  attribution: '',
  translation_candidates: [],
});

const v1 = {
  version: 'EnglishDictionary-2026-11-25.1',
  checksum: 'v1',
  built_at: '2026-11-25T00:00:00Z',
  source: {},
  items: [item(null)],
};
const v2 = {
  ...v1,
  version: 'EnglishDictionary-2026-11-25.2',
  checksum: 'v2',
  items: [item('The house is near the river.')],
};

initPack(db, v1);
db.exec({
  sql: `INSERT INTO user_progress
    (user_id, item_id, state, stability, stabilityFast, difficulty, dueAt,
     lastReviewAt, reps, lapses, scheduledDays, learningStep, scheduleStatus, fsrs_version, params_version)
    VALUES ('local', ?, 2, ?, ?, 5, ?, ?, 3, 0, 12, 0, 'Review', 'FSRS-7', '1')`,
  bind: [v1.items[0].id, 12, 12, '2026-12-08T00:00:00Z', '2026-11-25T00:00:00Z'],
});
db.exec({
  sql: `INSERT INTO gameplay_event
    (event_id, name, item_id, occurred_at, schema_version, pack_version, payload)
    VALUES ('legacy-event', 'answer', ?, ?, '1', ?, ?)`,
  bind: [v1.items[0].id, '2026-11-25T00:00:00Z', v1.version, JSON.stringify({ correct: true })],
});
db.exec({
  sql: "INSERT INTO notebook (user_id, item_id, marked_at) VALUES ('local', ?, ?)",
  bind: [v1.items[0].id, '2026-11-25T00:00:00Z'],
});

initPack(db, v2);

const progress = db.selectObjects('SELECT stability, reps FROM user_progress WHERE item_id = ?', [v1.items[0].id]);
assert.equal(progress.length, 1);
assert.equal(progress[0].stability, 12);
assert.equal(progress[0].reps, 3);

const events = db.selectObjects('SELECT schema_version FROM gameplay_event');
assert.equal(events.length, 1);
assert.equal(events[0].schema_version, '1');

const notebook = db.selectObjects("SELECT item_id FROM notebook WHERE user_id = 'local'");
assert.equal(notebook.length, 1);

const itemVersions = db.selectObjects('SELECT pack_version, COUNT(*) AS total FROM item GROUP BY pack_version').map((row) => ({ ...row }));
assert.deepEqual(itemVersions, [{ pack_version: v2.version, total: 1 }]);

const payload = JSON.parse(String(db.selectValue('SELECT payload FROM item WHERE pack_version = ?', [v2.version])));
assert.deepEqual(payload.examples_en, ['The house is near the river.']);

console.log('migração v1 -> v2 OK: progresso, eventos e caderno preservados; itens antigos removidos.');
db.close();
