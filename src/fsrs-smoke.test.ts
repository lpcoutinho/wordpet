import { describe, expect, it } from 'vitest';
import { runFsrsSmoke } from './fsrs-smoke';

describe('smoke FSRS-7', () => {
  it('gera quatro notas e um cartão revisado com estado completo', async () => {
    const now = new Date('2026-11-25T12:00:00.000Z');
    const result = await runFsrsSmoke(now);

    expect(result.previewGrades).toHaveLength(4);
    expect(result.cardId).toBe('word-sense-smoke');
    expect(result.reps).toBe(1);
    expect(result.stability).toBeGreaterThan(0);
    expect(result.stabilityFast).toBeGreaterThan(0);
    expect(result.difficulty).toBeGreaterThan(0);
    expect(new Date(result.goodDueAt).getTime()).toBeGreaterThan(now.getTime());
  });
});
