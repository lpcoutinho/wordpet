import type { Choice, Item } from '../core/item';
import type { Metrics } from '../core/metrics';
import { createSprite, type Sprite, type SpriteState } from './sprite';

export interface CardView {
  element: HTMLElement;
  onAnswer(handler: (choice: Choice) => void): void;
  onWordTap(handler: (word: string) => void): void;
  onGlossToggle(handler: (itemId: string, add: boolean) => void): void;
  onMinimize(handler: () => void): void;
  onClose(handler: () => void): void;
  render(item: Item, choices: Choice[]): void;
  feedback(correct: boolean, answer: string, example: string | null, xp: number): void;
  showGloss(text: string, itemId: string, marked: boolean): void;
  setSprite(state: SpriteState): void;
  setStats(metrics: Metrics, streak: number): void;
  setStatus(message: string): void;
}

export const createCardView = (): CardView => {
  const element = document.createElement('main');
  element.className = 'app';
  element.innerHTML = `
    <header class="app__header">
      <div class="app__brand">
        <p class="app__eyebrow">wordpet · phase 0</p>
        <h1 class="app__title">Vocabulary trainer</h1>
      </div>
      <div class="app__tools">
        <div class="app__stats" data-role="stats"></div>
        <div class="window-controls" aria-label="Window controls">
          <button class="window-control" type="button" data-role="minimize" aria-label="Minimize" title="Minimize">−</button>
          <button class="window-control window-control--close" type="button" data-role="close" aria-label="Close" title="Close">×</button>
        </div>
      </div>
    </header>
    <div class="app__main">
      <section class="pet" aria-label="Pet">
        <div data-role="sprite"></div>
        <p class="pet__label" data-role="status">Getting ready...</p>
      </section>
      <section class="card" aria-live="polite">
        <p class="card__prompt">Which word matches this meaning?</p>
        <div class="card__word" data-role="word"></div>
        <p class="card__hint" data-role="hint"></p>
        <p class="card__gloss" data-role="gloss" hidden></p>
        <button class="card__gloss-toggle" type="button" data-role="gloss-toggle" hidden></button>
        <p class="card__feedback" data-role="feedback"></p>
        <div class="card__choices" data-role="choices"></div>
      </section>
    </div>
    <footer class="app__footer" data-role="source"></footer>
  `;

  const spriteHost = element.querySelector<HTMLElement>('[data-role="sprite"]')!;
  const sprite: Sprite = createSprite();
  spriteHost.append(sprite.element);

  const word = element.querySelector<HTMLElement>('[data-role="word"]')!;
  const hint = element.querySelector<HTMLElement>('[data-role="hint"]')!;
  const choicesHost = element.querySelector<HTMLElement>('[data-role="choices"]')!;
  const glossHost = element.querySelector<HTMLElement>('[data-role="gloss"]')!;
  const glossToggle = element.querySelector<HTMLButtonElement>('[data-role="gloss-toggle"]')!;
  const feedbackHost = element.querySelector<HTMLElement>('[data-role="feedback"]')!;
  const statsHost = element.querySelector<HTMLElement>('[data-role="stats"]')!;
  const statusHost = element.querySelector<HTMLElement>('[data-role="status"]')!;
  const sourceHost = element.querySelector<HTMLElement>('[data-role="source"]')!;
  const minimizeButton = element.querySelector<HTMLButtonElement>('[data-role="minimize"]')!;
  const closeButton = element.querySelector<HTMLButtonElement>('[data-role="close"]')!;
  let answerHandler: ((choice: Choice) => void) | null = null;
  let wordHandler: ((word: string) => void) | null = null;
  let glossHandler: ((itemId: string, add: boolean) => void) | null = null;
  let minimizeHandler: (() => void) | null = null;
  let closeHandler: (() => void) | null = null;
  let answered = false;

  word.addEventListener('click', (event) => {
    if (answered) return;
    const target = event.target as HTMLElement;
    const token = target.closest<HTMLElement>('[data-word]');
    if (token?.dataset.word) wordHandler?.(token.dataset.word);
  });

  glossToggle.addEventListener('click', () => {
    const itemId = glossToggle.dataset.itemId;
    if (!itemId) return;
    glossHandler?.(itemId, glossToggle.dataset.marked !== 'true');
  });

  minimizeButton.addEventListener('click', () => minimizeHandler?.());
  closeButton.addEventListener('click', () => closeHandler?.());

  return {
    element,
    onAnswer: (next) => {
      answerHandler = next;
    },
    onWordTap: (next) => {
      wordHandler = next;
    },
    onGlossToggle: (next) => {
      glossHandler = next;
    },
    onMinimize: (next) => {
      minimizeHandler = next;
    },
    onClose: (next) => {
      closeHandler = next;
    },
    render: (item, choices) => {
      answered = false;
      word.replaceChildren();
      const parts = (item.promptEn || item.glossEn).split(/([A-Za-z][A-Za-z'-]*)/g);
      for (const part of parts) {
        if (!part) continue;
        if (/^[A-Za-z][A-Za-z'-]*$/.test(part)) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'word-token';
          button.dataset.word = part;
          button.textContent = part;
          word.append(button);
        } else {
          word.append(document.createTextNode(part));
        }
      }
      word.title = '';
      hint.textContent = item.pos;
      glossHost.hidden = true;
      glossHost.textContent = '';
      glossToggle.hidden = true;
      glossToggle.dataset.itemId = '';
      feedbackHost.textContent = '';
      feedbackHost.className = 'card__feedback';
      sourceHost.textContent = '';
      choicesHost.replaceChildren();
      for (const choice of choices) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'choice';
        button.textContent = choice.label;
        button.dataset.itemId = choice.itemId;
        button.addEventListener('click', () => {
          if (answered) {
            wordHandler?.(choice.label);
            return;
          }
          answered = true;
          for (const other of choicesHost.querySelectorAll('button')) other.classList.add('choice--locked');
          answerHandler?.(choice);
        });
        choicesHost.append(button);
      }
    },
    feedback: (correct, answer, example, xp) => {
      answered = true;
      const context = example ? ` Example: ${example}` : '';
      feedbackHost.textContent = correct
        ? `Correct: ${answer}.${context} +${xp} XP`
        : `Answer: ${answer}.${context} No XP this round.`;
      feedbackHost.className = `card__feedback ${correct ? 'card__feedback--ok' : 'card__feedback--miss'}`;
    },
    showGloss: (text, itemId, marked) => {
      glossHost.textContent = text;
      glossHost.hidden = false;
      glossToggle.hidden = false;
      glossToggle.dataset.itemId = itemId;
      glossToggle.dataset.marked = String(marked);
      glossToggle.textContent = marked ? 'Remove from my words' : 'Add to my words';
    },
    setSprite: (state) => sprite.setState(state),
    setStats: (metrics, streak) => {
      const recall = metrics.delayed_recall_1d.rate;
      statsHost.innerHTML = `
        <span><strong>${metrics.xp_total}</strong> XP</span>
        <span><strong>${streak}</strong> streak</span>
        <span><strong>${recall === null ? '—' : `${Math.round(recall * 100)}%`}</strong> recall 1d</span>
      `;
    },
    setStatus: (message) => {
      statusHost.textContent = message;
    },
  };
};
