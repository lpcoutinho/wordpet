import { clozeSentence, type Choice, type Item, type PromptFormat } from '../core/item';
import type { Metrics } from '../core/metrics';
import type { PetStage } from '../core/pet';
import type { RatingValue } from '../core/rewards';
import { createSprite, type Sprite, type SpriteState } from './sprite';

export interface CardView {
  element: HTMLElement;
  onAnswer(handler: (choice: Choice, responseMs: number) => void): void;
  onRate(handler: (rating: RatingValue) => void): void;
  onType(handler: (text: string, responseMs: number) => void): void;
  onWordTap(handler: (word: string) => void): void;
  onGlossToggle(handler: (itemId: string, add: boolean) => void): void;
  onMinimize(handler: () => void): void;
  onClose(handler: () => void): void;
  onEvidenceToggle(handler: () => void): void;
  onEvidenceExport(handler: () => void): void;
  render(item: Item, choices: Choice[], format: PromptFormat): void;
  feedback(correct: boolean, answer: string, example: string | null): void;
  showRating(): void;
  finishRating(xp: number): void;
  showGloss(text: string, itemId: string, marked: boolean): void;
  setSprite(state: SpriteState): void;
  setPetStage(stage: PetStage): void;
  setStats(metrics: Metrics, streak: number): void;
  setStatus(message: string): void;
  showEvidence(metrics: Metrics, streak: number): void;
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
        <button class="app__evidence-toggle" type="button" data-role="evidence-toggle">Evidence</button>
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
        <p class="card__prompt" data-role="prompt">Which word matches this meaning?</p>
        <div class="card__word" data-role="word"></div>
        <p class="card__hint" data-role="hint"></p>
        <p class="card__gloss" data-role="gloss" hidden></p>
        <button class="card__gloss-toggle" type="button" data-role="gloss-toggle" hidden></button>
        <p class="card__feedback" data-role="feedback"></p>
        <div class="card__choices" data-role="choices"></div>
        <form class="card__typing" data-role="typing" hidden>
          <input class="typing__input" type="text" data-role="typing-input" aria-label="Your answer" autocomplete="off" autocapitalize="off" spellcheck="false" />
          <button class="typing__submit" type="submit">Check</button>
        </form>
        <div class="card__rating" data-role="rating" hidden>
          <button class="rating" type="button" data-rating="1">Again</button>
          <button class="rating" type="button" data-rating="2">Hard</button>
          <button class="rating" type="button" data-rating="3">Good</button>
          <button class="rating" type="button" data-rating="4">Easy</button>
        </div>
      </section>
      <section class="evidence" data-role="evidence" hidden>
        <div class="evidence__head">
          <h2 class="evidence__title">Local evidence</h2>
          <button class="evidence__close" type="button" data-role="evidence-close" aria-label="Close evidence">×</button>
        </div>
        <dl class="evidence__grid" data-role="evidence-metrics"></dl>
        <div class="evidence__actions">
          <button class="evidence__action" type="button" data-role="evidence-csv">Download CSV</button>
        </div>
      </section>
    </div>
    <footer class="app__footer" data-role="source"></footer>
  `;

  const spriteHost = element.querySelector<HTMLElement>('[data-role="sprite"]')!;
  const sprite: Sprite = createSprite();
  spriteHost.append(sprite.element);

  const promptHost = element.querySelector<HTMLElement>('[data-role="prompt"]')!;
  const word = element.querySelector<HTMLElement>('[data-role="word"]')!;
  const hint = element.querySelector<HTMLElement>('[data-role="hint"]')!;
  const choicesHost = element.querySelector<HTMLElement>('[data-role="choices"]')!;
  const typingHost = element.querySelector<HTMLFormElement>('[data-role="typing"]')!;
  const typingInput = element.querySelector<HTMLInputElement>('[data-role="typing-input"]')!;
  const ratingHost = element.querySelector<HTMLElement>('[data-role="rating"]')!;
  const glossHost = element.querySelector<HTMLElement>('[data-role="gloss"]')!;
  const glossToggle = element.querySelector<HTMLButtonElement>('[data-role="gloss-toggle"]')!;
  const feedbackHost = element.querySelector<HTMLElement>('[data-role="feedback"]')!;
  const statsHost = element.querySelector<HTMLElement>('[data-role="stats"]')!;
  const statusHost = element.querySelector<HTMLElement>('[data-role="status"]')!;
  const sourceHost = element.querySelector<HTMLElement>('[data-role="source"]')!;
  const minimizeButton = element.querySelector<HTMLElement>('[data-role="minimize"]')!;
  const closeButton = element.querySelector<HTMLElement>('[data-role="close"]')!;
  const evidenceToggle = element.querySelector<HTMLButtonElement>('[data-role="evidence-toggle"]')!;
  const evidenceHost = element.querySelector<HTMLElement>('[data-role="evidence"]')!;
  const evidenceMetrics = element.querySelector<HTMLElement>('[data-role="evidence-metrics"]')!;
  const evidenceClose = element.querySelector<HTMLButtonElement>('[data-role="evidence-close"]')!;
  const evidenceCsvButton = element.querySelector<HTMLButtonElement>('[data-role="evidence-csv"]')!;
  const ratingButtons = [...ratingHost.querySelectorAll<HTMLButtonElement>('[data-rating]')];
  let answerHandler: ((choice: Choice, responseMs: number) => void) | null = null;
  let rateHandler: ((rating: RatingValue) => void) | null = null;
  let typeHandler: ((text: string, responseMs: number) => void) | null = null;
  let wordHandler: ((word: string) => void) | null = null;
  let glossHandler: ((itemId: string, add: boolean) => void) | null = null;
  let minimizeHandler: (() => void) | null = null;
  let closeHandler: (() => void) | null = null;
  let evidenceToggleHandler: (() => void) | null = null;
  let evidenceExportHandler: (() => void) | null = null;
  let answered = false;
  let rated = false;
  let renderedAt = 0;
  let feedbackText = '';

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

  for (const button of ratingButtons) {
    button.addEventListener('click', () => {
      if (!answered || rated) return;
      rated = true;
      for (const other of ratingButtons) other.disabled = true;
      rateHandler?.(Number(button.dataset.rating) as RatingValue);
    });
  }

  typingHost.addEventListener('submit', (event) => {
    event.preventDefault();
    if (answered || !typingInput.value.trim()) return;
    answered = true;
    const responseMs = Math.round(performance.now() - renderedAt);
    typingInput.disabled = true;
    typeHandler?.(typingInput.value, responseMs);
  });

  evidenceToggle.addEventListener('click', () => evidenceToggleHandler?.());
  evidenceClose.addEventListener('click', () => {
    evidenceHost.hidden = true;
  });
  evidenceCsvButton.addEventListener('click', () => evidenceExportHandler?.());

  minimizeButton.addEventListener('click', () => minimizeHandler?.());
  closeButton.addEventListener('click', () => closeHandler?.());

  return {
    element,
    onAnswer: (next) => {
      answerHandler = next;
    },
    onRate: (next) => {
      rateHandler = next;
    },
    onType: (next) => {
      typeHandler = next;
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
    onEvidenceToggle: (next) => {
      evidenceToggleHandler = next;
    },
    onEvidenceExport: (next) => {
      evidenceExportHandler = next;
    },
    render: (item, choices, format) => {
      answered = false;
      rated = false;
      renderedAt = performance.now();
      feedbackText = '';
      word.replaceChildren();
      promptHost.textContent = format === 'cloze'
        ? 'Which word fits the blank?'
        : format === 'typing'
          ? 'Type the English word.'
          : 'Which word matches this meaning?';
      const promptText = format === 'cloze' ? clozeSentence(item) ?? item.promptEn : item.promptEn || item.glossEn;
      const parts = promptText.split(/([A-Za-z][A-Za-z'-]*)/g);
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
      ratingHost.hidden = true;
      for (const button of ratingButtons) button.disabled = false;
      sourceHost.textContent = '';
      const isTyping = format === 'typing';
      typingHost.hidden = !isTyping;
      choicesHost.hidden = isTyping;
      typingInput.value = '';
      typingInput.disabled = false;
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
          const responseMs = Math.round(performance.now() - renderedAt);
          for (const other of choicesHost.querySelectorAll('button')) other.classList.add('choice--locked');
          answerHandler?.(choice, responseMs);
        });
        choicesHost.append(button);
      }
      if (isTyping) typingInput.focus();
    },
    feedback: (correct, answer, example) => {
      answered = true;
      const context = example ? ` Example: ${example}` : '';
      feedbackText = correct
        ? `Correct: ${answer}.${context}`
        : `Answer: ${answer}.${context} No XP this round.`;
      feedbackHost.textContent = feedbackText;
      feedbackHost.className = `card__feedback ${correct ? 'card__feedback--ok' : 'card__feedback--miss'}`;
    },
    showRating: () => {
      ratingHost.hidden = false;
    },
    finishRating: (xp) => {
      ratingHost.hidden = true;
      feedbackHost.textContent = xp > 0 ? `${feedbackText} +${xp} XP` : feedbackText;
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
    setPetStage: (stage) => sprite.setStage(stage),
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
    showEvidence: (metrics, streak) => {
      const summary = (value: typeof metrics.delayed_recall_1d): string =>
        value.rate === null ? '—' : `${Math.round(value.rate * 100)}% (${value.correct}/${value.total})`;
      const tally = (record: Record<string, number>): string =>
        Object.entries(record).map(([key, value]) => `${key} ${value}`).join(' · ') || '—';
      const rows: Array<[string, string]> = [
        ['Recall 1d', summary(metrics.delayed_recall_1d)],
        ['Recall 7d', summary(metrics.delayed_recall_7d)],
        ['XP total', String(metrics.xp_total)],
        ['Answers', String(metrics.answers)],
        ['Streak', `${streak} day${streak === 1 ? '' : 's'}`],
        ['Formats', tally(metrics.by_format)],
        ['Ratings', tally(metrics.by_rating)],
      ];
      evidenceMetrics.replaceChildren(...rows.map(([label, value]) => {
        const row = document.createElement('div');
        const term = document.createElement('dt');
        term.textContent = label;
        const detail = document.createElement('dd');
        detail.textContent = value;
        row.append(term, detail);
        return row;
      }));
      evidenceHost.hidden = false;
    },
  };
};
