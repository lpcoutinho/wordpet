import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { ContentPack } from './content/types';
import type { GameplayEvent } from './core/metrics';

export interface SerializedCard {
  cardId: string;
  state: number;
  stability: number;
  stabilityFast: number;
  difficulty: number;
  dueAt: string;
  lastReviewAt: string | null;
  reps: number;
  lapses: number;
  scheduledDays: number;
  learningStep: number;
  scheduleStatus: string;
}

export interface SerializedRevlog {
  cardId: string;
  rating: number;
  reviewTime: string;
  state: number;
  stability: number;
  stabilityFast: number;
  difficulty: number;
  dueAt: string;
  scheduledDays: number;
  learningStep: number;
  scheduleStatus: string;
}

type Incoming =
  | { id: number; type: 'init'; pack: ContentPack }
  | { id: number; type: 'getState' }
  | { id: number; type: 'saveReview'; card: SerializedCard; revlog: SerializedRevlog; events: GameplayEvent[] }
  | { id: number; type: 'appendEvent'; event: GameplayEvent }
  | { id: number; type: 'markWord'; card: SerializedCard; at: string }
  | { id: number; type: 'unmarkWord'; itemId: string };

interface Db {
  exec(options: { sql: string; bind?: unknown[] }): unknown;
  selectObjects(sql: string, bind?: unknown[]): Array<Record<string, unknown>>;
  selectValue(sql: string, bind?: unknown[]): unknown;
  prepare(sql: string): {
    bind(values: unknown[]): { stepReset(): void };
    finalize(): void;
  };
  close(): void;
}

const post = (message: unknown): void => {
  (self as unknown as { postMessage(value: unknown): void }).postMessage(message);
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS content_pack (
  version TEXT PRIMARY KEY,
  checksum TEXT NOT NULL,
  built_at TEXT NOT NULL,
  source TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS item (
  item_id TEXT PRIMARY KEY,
  pack_version TEXT NOT NULL,
  lemma TEXT NOT NULL,
  pos TEXT NOT NULL,
  sense_index TEXT NOT NULL,
  definition_en TEXT,
  translation_ptbr TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  license TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notebook (
  user_id TEXT NOT NULL DEFAULT 'local',
  item_id TEXT NOT NULL,
  marked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, item_id)
);
CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT NOT NULL DEFAULT 'local',
  item_id TEXT NOT NULL,
  state INTEGER NOT NULL,
  stability REAL NOT NULL,
  stabilityFast REAL NOT NULL,
  difficulty REAL NOT NULL,
  dueAt TEXT NOT NULL,
  lastReviewAt TEXT,
  reps INTEGER NOT NULL,
  lapses INTEGER NOT NULL,
  scheduledDays REAL NOT NULL DEFAULT 0,
  learningStep INTEGER NOT NULL DEFAULT 0,
  scheduleStatus TEXT NOT NULL DEFAULT 'new',
  fsrs_version TEXT NOT NULL,
  params_version TEXT NOT NULL,
  PRIMARY KEY (user_id, item_id)
);
CREATE TABLE IF NOT EXISTS gameplay_event (
  event_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  item_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  pack_version TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
  outbox_id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS gameplay_event_item ON gameplay_event(item_id, occurred_at);
PRAGMA user_version = 1;
`;

let db: Db | null = null;
let sqliteVersion = '';

const open = async (): Promise<Db> => {
  if (db) return db;
  const sqlite3 = await sqlite3InitModule();
  sqliteVersion = sqlite3.version.libVersion;
  const oo1 = sqlite3.oo1 as unknown as Record<string, new (filename: string) => unknown>;
  const DbClass = oo1.OpfsDb ?? oo1.DB;
  const opened = new DbClass('/wordpet.sqlite3') as unknown as Db;
  opened.exec({ sql: SCHEMA });
  const columns = opened.selectObjects('PRAGMA table_info(user_progress)').map((row) => String(row.name));
  if (!columns.includes('scheduledDays')) opened.exec({ sql: 'ALTER TABLE user_progress ADD COLUMN scheduledDays REAL NOT NULL DEFAULT 0' });
  if (!columns.includes('learningStep')) opened.exec({ sql: 'ALTER TABLE user_progress ADD COLUMN learningStep INTEGER NOT NULL DEFAULT 0' });
  if (!columns.includes('scheduleStatus')) opened.exec({ sql: "ALTER TABLE user_progress ADD COLUMN scheduleStatus TEXT NOT NULL DEFAULT 'new'" });
  db = opened;
  return opened;
};

const run = (connection: Db, sql: string, bind: unknown[] = []): void => {
  connection.exec({ sql, bind });
};

const insertEvent = (connection: Db, event: GameplayEvent): void => {
  run(connection, `INSERT OR IGNORE INTO gameplay_event
    (event_id, name, item_id, occurred_at, schema_version, pack_version, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    event.event_id, event.name, event.item_id, event.occurred_at,
    event.schema_version, event.pack_version, JSON.stringify(event.payload),
  ]);
  run(connection, `INSERT OR IGNORE INTO outbox (event_id, payload, created_at) VALUES (?, ?, ?)`, [
    event.event_id, JSON.stringify(event), event.occurred_at,
  ]);
};

const upsertCard = (connection: Db, card: SerializedCard): void => {
  run(connection, `INSERT INTO user_progress
    (user_id, item_id, state, stability, stabilityFast, difficulty, dueAt, lastReviewAt,
     reps, lapses, scheduledDays, learningStep, scheduleStatus, fsrs_version, params_version)
    VALUES ('local', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'FSRS-7', '1')
    ON CONFLICT(user_id, item_id) DO UPDATE SET
      state = excluded.state,
      stability = excluded.stability,
      stabilityFast = excluded.stabilityFast,
      difficulty = excluded.difficulty,
      dueAt = excluded.dueAt,
      lastReviewAt = excluded.lastReviewAt,
      reps = excluded.reps,
      lapses = excluded.lapses,
      scheduledDays = excluded.scheduledDays,
      learningStep = excluded.learningStep,
      scheduleStatus = excluded.scheduleStatus`, [
    card.cardId, card.state, card.stability, card.stabilityFast, card.difficulty,
    card.dueAt, card.lastReviewAt, card.reps, card.lapses,
    card.scheduledDays, card.learningStep, card.scheduleStatus,
  ]);
};

const handle = (message: Incoming): unknown => {
  if (message.type === 'init') {
    const connection = db!;
    const version = message.pack.version;
    const existingChecksum = connection.selectValue('SELECT checksum FROM content_pack WHERE version = ?', [version]);
    const existingCount = Number(connection.selectValue('SELECT COUNT(*) FROM item WHERE pack_version = ?', [version]) ?? 0);
    if (existingChecksum === message.pack.checksum && existingCount === message.pack.items.length && existingCount > 0) {
      return { initialized: true, version, sqliteVersion, reused: true };
    }
    run(connection, 'BEGIN');
    try {
      run(connection, `INSERT OR REPLACE INTO content_pack (version, checksum, built_at, source) VALUES (?, ?, ?, ?)`, [
        version, message.pack.checksum, message.pack.built_at, JSON.stringify(message.pack.source),
      ]);
      run(connection, 'DELETE FROM item WHERE pack_version = ?', [version]);
      const insertItem = connection.prepare(`INSERT INTO item
          (item_id, pack_version, lemma, pos, sense_index, definition_en, translation_ptbr,
           source_id, source_url, license, payload)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      try {
        for (const item of message.pack.items) {
          insertItem.bind([
            item.id, version, item.lemma, item.pos, item.sense_index, item.definition_en,
            item.translation_ptbr, item.source_id, item.source_url, item.license,
            JSON.stringify({
              gloss_en: item.gloss_en,
              examples_en: item.examples_en,
              weight: item.weight,
              frequency_rank: item.frequency_rank,
            }),
          ]).stepReset();
        }
      } finally {
        insertItem.finalize();
      }
      run(connection, 'COMMIT');
    } catch (error) {
      run(connection, 'ROLLBACK');
      throw error;
    }
    return { initialized: true, version, sqliteVersion, reused: false };
  }

  if (message.type === 'getState') {
    const connection = db!;
    const progress = connection.selectObjects(`SELECT item_id AS cardId, state, stability, stabilityFast, difficulty,
      dueAt, lastReviewAt, reps, lapses, scheduledDays, learningStep, scheduleStatus
      FROM user_progress WHERE user_id = 'local'`);
    const events = connection.selectObjects(`SELECT event_id, name, item_id, occurred_at,
      schema_version, pack_version, payload FROM gameplay_event ORDER BY occurred_at, event_id`)
      .map((row) => ({
        event_id: row.event_id,
        name: row.name,
        item_id: row.item_id,
        occurred_at: row.occurred_at,
        schema_version: row.schema_version,
        pack_version: row.pack_version,
        payload: JSON.parse(String(row.payload)),
      }));
    const notebook = connection.selectObjects('SELECT item_id AS itemId FROM notebook WHERE user_id = \'local\' ORDER BY marked_at, item_id')
      .map((row) => String(row.itemId));
    const packVersion = connection.selectValue('SELECT version FROM content_pack ORDER BY built_at DESC LIMIT 1');
    return { progress, events, notebook, packVersion: packVersion ?? null };
  }

  const connection = db!;
  run(connection, 'BEGIN');
  try {
    if (message.type === 'appendEvent') {
      insertEvent(connection, message.event);
      run(connection, 'COMMIT');
      return { saved: true };
    }
    if (message.type === 'saveReview') {
      upsertCard(connection, message.card);
      for (const event of message.events) insertEvent(connection, event);
    }
    if (message.type === 'markWord') {
      upsertCard(connection, message.card);
      run(connection, `INSERT INTO notebook (user_id, item_id, marked_at) VALUES ('local', ?, ?)
        ON CONFLICT(user_id, item_id) DO UPDATE SET marked_at = excluded.marked_at`, [message.card.cardId, message.at]);
    }
    if (message.type === 'unmarkWord') {
      run(connection, "DELETE FROM notebook WHERE user_id = 'local' AND item_id = ?", [message.itemId]);
    }
    run(connection, 'COMMIT');
  } catch (error) {
    run(connection, 'ROLLBACK');
    throw error;
  }
  return { saved: true };
};

self.addEventListener('message', (event: MessageEvent<Incoming>) => {
  const message = event.data;
  void (async () => {
    try {
      await open();
      post({ id: message.id, ok: true, result: handle(message) });
    } catch (error) {
      post({ id: message.id, ok: false, error: String(error) });
    }
  })();
});
