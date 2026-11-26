import { describe, expect, it } from 'vitest';
import type { ContentPack, PackItem } from '../content/types';
import { buildChoices, clozeSentence, nextItem, normalizeAnswer, playableItems, promptFormatFor, toItem } from './item';
import { awardFor, ratingFor } from './rewards';
import { createScheduler } from './scheduler';
import { computeMetrics, type GameplayEvent } from './metrics';

const item = (id: string, rank: number): PackItem => ({
  id: `EnglishDictionary|${id}`,
  rank,
  frequency_rank: rank,
  weight: rank === 1 ? 101 : 100,
  lemma: id,
  pos: 'noun',
  sense_index: 'all',
  definition_en: `Definition of ${id}.`,
  prompt_en: `Definition of ${id}`,
  gloss_en: `Definition of ${id}.`,
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
  retrieved_at: '2026-11-25T00:00:00Z',
  attribution: '',
  translation_candidates: [],
});

const pack: ContentPack = {
  version: 'test.1',
  built_at: '2026-11-25T00:00:00Z',
  checksum: 'test',
  source: {
    wordlist: 'test',
    translations: 'test',
    examples: 'test',
    license: '',
    word_limit: 5,
    pack_limit: 5,
    primary_source: 'EnglishDictionary',
    validation_source: 'Wiktionary',
    entry_count: 5,
    frequency_weighted: true,
  },
  items: [item('house', 1), item('water', 2), item('book', 3), item('dog', 4), item('sun', 5)],
};

describe('nucleo de domino', () => {
  it('monta quatro alternativas unicas com a resposta correta', () => {
    const target = playableItems(pack)[0]!;
    const choices = buildChoices(target, pack);
    expect(choices).toHaveLength(4);
    expect(new Set(choices.map((choice) => choice.label)).size).toBe(4);
    expect(choices.some((choice) => choice.itemId === target.id && choice.label === 'house')).toBe(true);
    expect(buildChoices(target, pack)).toEqual(choices);
  });

  it('aprova item sem exemplo e mantem gloss curto', () => {
    const target = playableItems(pack)[0]!;
    expect(target.exampleEn).toBeNull();
    expect(target.promptEn).toBe('Definition of house');
    expect(target.glossEn).toBe('Definition of house.');
    expect(target.sensesEn).toEqual(['Definition of house.']);
  });

  it('monta cloze com o lema no exemplo', () => {
    const source = item('house', 1);
    source.example_en = 'The house is near the river.';
    expect(clozeSentence(toItem(source))).toBe('The ______ is near the river.');
    source.example_en = 'A building is nearby.';
    expect(clozeSentence(toItem(source))).toBeNull();
  });

  it('alterna para cloze depois de duas repeticoes quando ha exemplo', () => {
    const source = item('house', 1);
    source.example_en = 'The house is near the river.';
    const withExample = toItem(source);
    expect(promptFormatFor(withExample, 0)).toBe('choice');
    expect(promptFormatFor(withExample, 2)).toBe('cloze');
    expect(promptFormatFor(withExample, 4)).toBe('typing');
    expect(promptFormatFor(toItem(item('water', 2)), 2)).toBe('choice');
    expect(promptFormatFor(toItem(item('water', 4)), 4)).toBe('typing');
  });

  it('normaliza resposta digitada ignorando caixa e pontuacao', () => {
    expect(normalizeAnswer('  Ice-Cream! ')).toBe('icecream');
  });

  it('prioriza vencidos com amostragem ponderada e depois itens novos', () => {
    const items = playableItems(pack);
    const now = new Date('2026-11-25T12:00:00Z');
    const progress = new Map([
      [items[0]!.id, { dueAt: new Date('2026-11-24T12:00:00Z'), reps: 1 }],
      [items[1]!.id, { dueAt: new Date('2026-11-23T12:00:00Z'), reps: 1 }],
    ]);
    expect(nextItem(items, { get: (id) => progress.get(id) }, now, () => 0.51)?.lemma).toBe('water');
    expect(nextItem(items, { get: () => undefined }, now, () => 0)?.lemma).toBe('house');
  });

  it('concede XP por confianca apenas em acerto antes da revelacao', () => {
    expect(awardFor({ revealed: false, correct: true, rating: 1 })).toBe(5);
    expect(awardFor({ revealed: false, correct: true, rating: 2 })).toBe(5);
    expect(awardFor({ revealed: false, correct: true, rating: 3 })).toBe(10);
    expect(awardFor({ revealed: false, correct: true, rating: 4 })).toBe(15);
    expect(awardFor({ revealed: true, correct: true, rating: 4 })).toBe(0);
    expect(awardFor({ revealed: false, correct: false, rating: 4 })).toBe(0);
    expect(ratingFor({ revealed: false, correct: false })).toBe(1);
    expect(ratingFor({ revealed: false, correct: true })).toBe(3);
  });

  it('agenda revisao FSRS-7 com relogio injetado', async () => {
    const scheduler = await createScheduler();
    const now = new Date('2026-11-25T00:00:00Z');
    const card = scheduler.newCard('EnglishDictionary|house', now);
    expect(scheduler.preview(card, now)).toEqual([1, 2, 3, 4]);
    const { card: next, revlog } = scheduler.review(card, 3, now);
    expect(next.reps).toBe(1);
    expect(next.stabilityFast).toBeGreaterThan(0);
    expect(next.dueAt.getTime()).toBeGreaterThan(now.getTime());
    expect(revlog.rating).toBe(3);
    expect(revlog.reviewTime.toISOString()).toBe(now.toISOString());
    expect(card.reps).toBe(0);
  });

  it('calcula recall diferido ignorando exposicao e revisoes imediatas', () => {
    const event = (id: string, name: GameplayEvent['name'], occurredAt: string, payload: Record<string, unknown>): GameplayEvent => ({
      event_id: id,
      name,
      item_id: 'house',
      occurred_at: occurredAt,
      schema_version: '1',
      pack_version: 'test.1',
      payload,
    });
    const events = [
      event('1', 'exposure', '2026-11-25T00:00:00Z', { correct: true }),
      event('2', 'answer', '2026-11-25T00:01:00Z', { scheduled: false, correct: true }),
      event('3', 'answer', '2026-11-26T00:00:00Z', {
        scheduled: true,
        correct: true,
        previous_due_at: '2026-11-25T00:00:00Z',
      }),
      event('4', 'answer', '2026-12-03T00:00:00Z', {
        scheduled: true,
        correct: false,
        previous_due_at: '2026-11-25T00:00:00Z',
      }),
      event('5', 'xp_award', '2026-11-26T00:00:00Z', { amount: 10 }),
    ];
    const metrics = computeMetrics(events);
    expect(metrics.delayed_recall_1d).toEqual({ correct: 1, total: 2, rate: 0.5 });
    expect(metrics.delayed_recall_7d).toEqual({ correct: 0, total: 1, rate: 0 });
    expect(metrics.xp_total).toBe(10);
    expect(metrics.answers).toBe(3);
  });

  it('expõe prompt curto sem citacoes', () => {
    const source = item('partial', 1);
    source.definition_en = 'Of, pertaining to, or affecting, a part only; not general or universal. "Partial dissolutions of the earth." T. Burnet.';
    source.gloss_en = 'Of, pertaining to, or affecting, a part only;';
    source.prompt_en = 'Of, pertaining to, or affecting, a part only';
    const target = toItem(source) as unknown as { promptEn?: string };
    expect(target.promptEn).toBe('Of, pertaining to, or affecting, a part only');
  });

});
