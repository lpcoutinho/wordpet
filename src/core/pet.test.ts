import { describe, expect, it } from 'vitest';
import { petStageFor } from './pet';
import type { CardState } from './scheduler';

const card = (stability: number): CardState => ({
  cardId: `card:${stability}`,
  state: 2,
  stability,
  stabilityFast: stability,
  difficulty: 5,
  dueAt: new Date('2026-11-26T00:00:00Z'),
  lastReviewAt: new Date('2026-11-25T00:00:00Z'),
  reps: 3,
  lapses: 0,
  scheduledDays: stability,
  learningStep: 0,
  scheduleStatus: 'Review',
});

describe('petStageFor', () => {
  it('evolui pela maior estabilidade, nao pelo total de acertos', () => {
    expect(petStageFor([])).toBe('egg');
    expect(petStageFor([card(0.5), card(0.8)])).toBe('egg');
    expect(petStageFor([card(1.2), card(6)])).toBe('hatchling');
    expect(petStageFor([card(0.1), card(7.5)])).toBe('companion');
    expect(petStageFor([card(2), card(30)])).toBe('guardian');
  });
});
