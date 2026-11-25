import { describe, expect, it } from 'vitest';
import type { Item } from './item';
import { buildWordIndex, resolveTappedWord } from './notebook';

const item = (lemma: string): Item => ({
  id: `EnglishDictionary|${lemma}`,
  type: 'word_sense',
  lemma,
  pos: 'noun',
  senseIndex: 'all',
  definitionEn: `Definition of ${lemma}.`,
  promptEn: `Definition of ${lemma}`,
  glossEn: `Definition of ${lemma}.`,
  sensesEn: [`Definition of ${lemma}.`],
  exampleEn: null,
  answerEn: lemma,
  weight: 1,
  source: { id: 'EnglishDictionary', url: '', license: '', attribution: '' },
});

const index = buildWordIndex([item('possess'), item('book'), item('company')]);

describe('caderno de palavras tocadas', () => {
  it('resolve palavra exata sem duplicar item', () => {
    expect(resolveTappedWord('Possess', index)?.itemId).toBe('EnglishDictionary|possess');
  });

  it('reduz flexion comuns ao lema', () => {
    expect(resolveTappedWord('possessing', index)?.lemma).toBe('possess');
    expect(resolveTappedWord('books', index)?.lemma).toBe('book');
    expect(resolveTappedWord('companies', index)?.lemma).toBe('company');
  });

  it('devolve nulo quando nao encontra lema', () => {
    expect(resolveTappedWord('zzzunknown', index)).toBeNull();
  });
});
