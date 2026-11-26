import { describe, expect, it } from 'vitest';
import { evidenceCsv } from './evidence';
import { computeMetrics, computeStreak, type GameplayEvent } from './metrics';

const now = new Date(2026, 10, 26, 15, 0, 0);

const answer = (offset: number, correct: boolean): GameplayEvent => ({
  event_id: `event-${offset}-${correct}`,
  name: 'answer',
  item_id: `EnglishDictionary|word-${offset}`,
  occurred_at: new Date(2026, 10, 26 + offset, 12, 0, 0).toISOString(),
  schema_version: '2',
  pack_version: 'test',
  payload: { correct },
});

describe('computeStreak', () => {
  it('conta dias consecutivos com recall verificado', () => {
    expect(computeStreak([answer(0, true), answer(-1, true), answer(-2, true)], now)).toBe(3);
  });

  it('nao quebra o streak durante o dia ainda sem resposta', () => {
    expect(computeStreak([answer(-1, true), answer(-2, true)], now)).toBe(2);
  });

  it('para em uma lacuna e ignora erros', () => {
    expect(computeStreak([answer(0, true), answer(-1, false), answer(-2, true)], now)).toBe(1);
  });
});


describe('computeMetrics', () => {
  it('agrupa respostas por formato e rating', () => {
    const events = [
      { ...answer(0, true), payload: { correct: true, format: 'cloze', rating: 3 } },
      { ...answer(-1, true), payload: { correct: true, format: 'typing', rating: 4 } },
    ];
    const metrics = computeMetrics(events);
    expect(metrics.answers).toBe(2);
    expect(metrics.by_format).toEqual({ cloze: 1, typing: 1 });
    expect(metrics.by_rating).toEqual({ '3': 1, '4': 1 });
  });
});

describe('evidenceCsv', () => {
  it('escapeia aspas e virgulas no payload', () => {
    const event = { ...answer(0, true), payload: { correct: true, chosen: 'a, "word"' } };
    const csv = evidenceCsv([event]);
    expect(csv).toContain('""chosen"":""a, \\""word\\""');
    expect(csv.trim().split('\n')).toHaveLength(2);
  });
});
