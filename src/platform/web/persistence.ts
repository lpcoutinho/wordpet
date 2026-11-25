import type { ContentPack } from '../../content/types';
import type { GameplayEvent } from '../../core/metrics';
import type { CardState, ReviewLogState } from '../../core/scheduler';
import type { SerializedCard, SerializedRevlog } from '../../db.worker';

type Reply = { id: number; ok: true; result: unknown } | { id: number; ok: false; error: string };

const serialiseCard = (card: CardState): SerializedCard => ({
  cardId: card.cardId,
  state: card.state,
  stability: card.stability,
  stabilityFast: card.stabilityFast,
  difficulty: card.difficulty,
  dueAt: card.dueAt.toISOString(),
  lastReviewAt: card.lastReviewAt?.toISOString() ?? null,
  reps: card.reps,
  lapses: card.lapses,
  scheduledDays: card.scheduledDays,
  learningStep: card.learningStep,
  scheduleStatus: card.scheduleStatus,
});

const deserialiseCard = (row: Record<string, unknown>): CardState => ({
  cardId: String(row.cardId),
  state: Number(row.state),
  stability: Number(row.stability),
  stabilityFast: Number(row.stabilityFast),
  difficulty: Number(row.difficulty),
  dueAt: new Date(String(row.dueAt)),
  lastReviewAt: row.lastReviewAt ? new Date(String(row.lastReviewAt)) : null,
  reps: Number(row.reps),
  lapses: Number(row.lapses),
  scheduledDays: Number(row.scheduledDays),
  learningStep: Number(row.learningStep),
  scheduleStatus: String(row.scheduleStatus),
});

const serialiseRevlog = (revlog: ReviewLogState): SerializedRevlog => ({
  cardId: revlog.cardId,
  rating: revlog.rating,
  reviewTime: revlog.reviewTime.toISOString(),
  state: revlog.state,
  stability: revlog.stability,
  stabilityFast: revlog.stabilityFast,
  difficulty: revlog.difficulty,
  dueAt: revlog.dueAt.toISOString(),
  scheduledDays: revlog.scheduledDays,
  learningStep: revlog.learningStep,
  scheduleStatus: revlog.scheduleStatus,
});

export interface PersistedState {
  progress: Map<string, CardState>;
  events: GameplayEvent[];
  notebook: string[];
  packVersion: string | null;
}

export interface Persistence {
  init(pack: ContentPack): Promise<void>;
  getState(): Promise<PersistedState>;
  saveReview(card: CardState, revlog: ReviewLogState, events: GameplayEvent[]): Promise<void>;
  appendEvent(event: GameplayEvent): Promise<void>;
  markWord(card: CardState, at: string): Promise<void>;
  unmarkWord(itemId: string): Promise<void>;
}

export const createPersistence = (): Persistence => {
  const worker = new Worker(new URL('../../db.worker.ts', import.meta.url), { type: 'module' });
  let nextId = 0;
  const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();

  worker.addEventListener('message', (event: MessageEvent<Reply>) => {
    const reply = event.data;
    const handler = pending.get(reply.id);
    if (!handler) return;
    pending.delete(reply.id);
    if (reply.ok) handler.resolve(reply.result);
    else handler.reject(new Error(reply.error));
  });

  const send = (payload: Record<string, unknown>): Promise<unknown> => {
    const id = nextId += 1;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, ...payload });
    });
  };

  return {
    init: async (pack) => {
      await send({ type: 'init', pack });
    },
    getState: async () => {
      const result = await send({ type: 'getState' }) as {
        progress: Array<Record<string, unknown>>;
        events: GameplayEvent[];
        notebook: string[];
        packVersion: string | null;
      };
      return {
        progress: new Map(result.progress.map((row) => {
          const card = deserialiseCard(row);
          return [card.cardId, card] as const;
        })),
        events: result.events,
        notebook: result.notebook,
        packVersion: result.packVersion,
      };
    },
    saveReview: async (card, revlog, events) => {
      await send({
        type: 'saveReview',
        card: serialiseCard(card),
        revlog: serialiseRevlog(revlog),
        events,
      });
    },
    appendEvent: async (event) => {
      await send({ type: 'appendEvent', event });
    },
    markWord: async (card, at) => {
      await send({ type: 'markWord', card: serialiseCard(card), at });
    },
    unmarkWord: async (itemId) => {
      await send({ type: 'unmarkWord', itemId });
    },
  };
};
