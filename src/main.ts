import packUrl from './content/pack.json?url';
import type { ContentPack } from './content/types';
import { buildChoices, nextItem, playableItems, type Choice, type Item } from './core/item';
import { awardFor, ratingFor } from './core/rewards';
import { computeMetrics, type GameplayEvent } from './core/metrics';
import { buildWordIndex, resolveTappedWord } from './core/notebook';
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
  schema_version: '1',
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
  let streak = 0;
  let lastGloss = '';

  const progressLookup = {
    get: (itemId: string) => progress.get(itemId),
  };

  const refreshStats = (): void => view.setStats(computeMetrics(events), streak);

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

    const choices: Choice[] = buildChoices(item, pack, 4, items);
    view.render(item, choices);
    view.setSprite('neutral');
    view.setStatus('Ready to play.');

    const exposure = makeEvent('exposure', item.id, now, { surface: 'web' });
    events.push(exposure);
    void persistence.appendEvent(exposure).catch(reportError);

    view.onAnswer((choice) => {
      void (async () => {
        const answerNow = new Date();
        const correct = choice.itemId === item.id;
        const revealed = false;
        const rating = ratingFor({ revealed, correct });
        const previous = progress.get(item.id);
        const card = previous ?? scheduler.newCard(item.id, answerNow);
        const reviewed = scheduler.review(card, rating, answerNow);
        progress.set(item.id, reviewed.card);

        const scheduled = Boolean(previous && previous.reps > 0);
        const xp = awardFor({ revealed, correct });
        const newEvents: GameplayEvent[] = [
          makeEvent('review', item.id, answerNow, {
            rating,
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
            chosen: choice.label,
            expected: item.answerEn,
            scheduled,
            previous_due_at: scheduled ? previous!.dueAt.toISOString() : null,
          }),
        ];
        if (xp > 0) {
          newEvents.push(makeEvent('xp_award', item.id, answerNow, { amount: xp, reason: 'active_recall' }));
        }

        events.push(...newEvents);
        streak = correct ? streak + 1 : 0;

        try {
          await persistence.saveReview(reviewed.card, reviewed.revlog, newEvents);
        } catch (error) {
          reportError(error);
        }

        view.feedback(correct, item.answerEn, item.exampleEn, xp);
        view.setSprite(correct ? 'happy' : 'neutral');
        refreshStats();
        window.setTimeout(showNext, correct ? 700 : 1400);
      })();
    });
  };

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
