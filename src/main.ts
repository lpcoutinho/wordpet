import packUrl from './content/pack.json?url';
import type { ContentPack } from './content/types';
import { buildChoices, nextItem, normalizeAnswer, playableItems, promptFormatFor, type Choice, type Item, type PromptFormat } from './core/item';
import { awardFor, ratingFor, type RatingValue } from './core/rewards';
import { computeMetrics, computeStreak, type GameplayEvent } from './core/metrics';
import { evidenceCsv } from './core/evidence';
import { buildWordIndex, resolveTappedWord } from './core/notebook';
import { PET_STAGE_LABEL, petStageFor } from './core/pet';
import { createScheduler } from './core/scheduler';
import { createPersistence } from './platform/web/persistence';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createCardView } from './ui/card';
import './style.css';

let pack: ContentPack;

const setSplashStatus = (message: string): void => {
  const status = document.querySelector<HTMLElement>('[data-role="splash-status"]');
  if (status) status.textContent = message;
};

const hideSplash = (): void => {
  document.querySelector<HTMLElement>('[data-role="splash"]')?.remove();
};

const loadPack = async (): Promise<ContentPack> => {
  const response = await fetch(packUrl);
  if (!response.ok) throw new Error(`content pack request failed (${response.status})`);
  return (await response.json()) as ContentPack;
};

const makeEvent = (
  name: GameplayEvent['name'],
  itemId: string,
  now: Date,
  payload: Record<string, unknown>,
): GameplayEvent => ({
  event_id: crypto.randomUUID(),
  name,
  item_id: itemId,
  occurred_at: now.toISOString(),
  schema_version: '2',
  pack_version: pack.version,
  payload,
});

const start = async (): Promise<void> => {
  const app = document.querySelector<HTMLElement>('#app');
  if (!app) throw new Error('Element #app was not found');

  const view = createCardView();
  app.append(view.element);
  view.setStatus('Loading...');

  setSplashStatus('Loading dictionary…');
  pack = await loadPack();
  setSplashStatus('Preparing memory…');
  const scheduler = await createScheduler();
  setSplashStatus('Opening local database…');
  const persistence = createPersistence();
  await persistence.init(pack);
  setSplashStatus('Restoring progress…');
  const initial = await persistence.getState();

  const progress = initial.progress;
  const events: GameplayEvent[] = [...initial.events];
  const marked = new Set(initial.notebook);
  const items = playableItems(pack);
  const wordIndex = buildWordIndex(items);
  const itemsById = new Map(items.map((item) => [item.id, item]));
  let lastGloss = '';

  const progressLookup = {
    get: (itemId: string) => progress.get(itemId),
  };

  const refreshStats = (): void => view.setStats(computeMetrics(events), computeStreak(events));
  const refreshPet = (): void => view.setPetStage(petStageFor(progress.values()));

  const IDLE_MS = 60_000;
  let idleTimer = 0;
  const armIdle = (): void => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (document.hidden) return;
      const stage = petStageFor(progress.values());
      view.setStatus(`Idle? One quick recall keeps your ${PET_STAGE_LABEL[stage].toLowerCase()} growing.`);
    }, IDLE_MS);
  };
  for (const type of ['pointerdown', 'keydown'] as const) {
    window.addEventListener(type, armIdle, { passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) armIdle();
  });

  const reportError = (error: unknown): void => {
    view.setStatus(`Local error: ${String(error)}`);
  };

  let appWindow: ReturnType<typeof getCurrentWindow> | null = null;
  try {
    appWindow = getCurrentWindow();
  } catch {
    appWindow = null;
  }

  view.onMinimize(() => {
    void appWindow?.minimize().catch(reportError);
  });
  view.onClose(() => {
    void appWindow?.close().catch(reportError);
  });

  view.onEvidenceToggle(() => {
    view.showEvidence(computeMetrics(events), computeStreak(events));
  });
  view.onEvidenceExport(() => {
    const blob = new Blob([evidenceCsv(events)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wordpet-evidence-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  });

  const markWord = async (itemId: string, gloss: string): Promise<void> => {
    const now = new Date();
    const previous = progress.get(itemId);
    const card = previous ? { ...previous, dueAt: now } : scheduler.newCard(itemId, now);
    progress.set(itemId, card);
    marked.add(itemId);
    lastGloss = gloss;
    await persistence.markWord(card, now.toISOString()).catch(reportError);
    view.showGloss(gloss, itemId, true);
  };

  view.onWordTap((raw) => {
    const token = raw.toLowerCase().replace(/[^a-z'-]/g, '');
    if (!token) return;
    const match = resolveTappedWord(token, wordIndex);
    if (!match) {
      void markWord(`word:${token}`, 'Not available yet');
      return;
    }
    const item: Item | undefined = itemsById.get(match.itemId);
    void markWord(match.itemId, item?.glossEn || match.glossEn || 'Not available yet');
  });

  view.onGlossToggle((itemId, add) => {
    void (async () => {
      if (add) {
        await markWord(itemId, lastGloss);
        return;
      }
      await persistence.unmarkWord(itemId).catch(reportError);
      marked.delete(itemId);
      view.showGloss(lastGloss, itemId, false);
    })();
  });

  const showNext = (): void => {
    const now = new Date();
    const item = nextItem(items, progressLookup, now);
    refreshStats();

    if (!item) {
      view.setSprite('sleeping');
      view.setStatus('All caught up.');
      return;
    }

    const before = progress.get(item.id);
    const format: PromptFormat = promptFormatFor(item, before?.reps ?? 0);
    const choices: Choice[] = buildChoices(item, pack, 4, items);
    view.render(item, choices, format);
    view.setSprite('neutral');
    view.setStatus('Ready to play.');
    armIdle();

    const exposure = makeEvent('exposure', item.id, now, { surface: 'web', format });
    events.push(exposure);
    void persistence.appendEvent(exposure).catch(reportError);

    let settled = false;
    const commit = async (
      rating: RatingValue,
      correct: boolean,
      chosen: string,
      responseMs: number,
    ): Promise<void> => {
      if (settled) return;
      settled = true;
      const answerNow = new Date();
      const revealed = false;
      view.feedback(correct, item.answerEn, item.exampleEn);

      const previous = progress.get(item.id);
      const card = previous ?? scheduler.newCard(item.id, answerNow);
      const reviewed = scheduler.review(card, rating, answerNow);
      progress.set(item.id, reviewed.card);

      const scheduled = Boolean(previous && previous.reps > 0);
      const xp = awardFor({ revealed, correct, rating });
      const newEvents: GameplayEvent[] = [
        makeEvent('review', item.id, answerNow, {
          rating,
          format,
          responseMs,
          cardId: reviewed.card.cardId,
          dueAt: reviewed.card.dueAt.toISOString(),
          stabilityFast: reviewed.card.stabilityFast,
          revlog: {
            rating: reviewed.revlog.rating,
            reviewTime: reviewed.revlog.reviewTime.toISOString(),
            stability: reviewed.revlog.stability,
            difficulty: reviewed.revlog.difficulty,
          },
        }),
        makeEvent('answer', item.id, answerNow, {
          correct,
          revealed,
          rating,
          format,
          responseMs,
          chosen,
          expected: item.answerEn,
          scheduled,
          previous_due_at: scheduled ? previous!.dueAt.toISOString() : null,
        }),
      ];
      if (xp > 0) {
        newEvents.push(makeEvent('xp_award', item.id, answerNow, {
          amount: xp,
          reason: 'active_recall',
          rating,
          format,
        }));
      }

      events.push(...newEvents);
      try {
        await persistence.saveReview(reviewed.card, reviewed.revlog, newEvents);
      } catch (error) {
        reportError(error);
      }

      view.finishRating(xp);
      view.setSprite(correct ? 'happy' : 'neutral');
      refreshPet();
      refreshStats();
      window.setTimeout(showNext, correct ? 700 : 1400);
    };

    view.onAnswer((choice, responseMs) => {
      const correct = choice.itemId === item.id;
      if (!correct) {
        void commit(ratingFor({ revealed: false, correct }), false, choice.label, responseMs);
        return;
      }
      view.showRating();
      view.onRate((rating) => {
        void commit(rating, true, choice.label, responseMs);
      });
    });

    view.onType((text, responseMs) => {
      const chosen = text.trim();
      const correct = normalizeAnswer(chosen) === normalizeAnswer(item.answerEn);
      if (!correct) {
        void commit(ratingFor({ revealed: false, correct }), false, chosen, responseMs);
        return;
      }
      view.showRating();
      view.onRate((rating) => {
        void commit(rating, true, chosen, responseMs);
      });
    });
  };

  refreshPet();
  setSplashStatus('Almost ready…');
  showNext();
  hideSplash();
};

void start().catch((error: unknown) => {
  hideSplash();
  const status = document.querySelector<HTMLElement>('[data-role="status"]');
  if (status) status.textContent = `Failed to start: ${String(error)}`;
  else document.body.textContent = `Failed to start: ${String(error)}`;
});
