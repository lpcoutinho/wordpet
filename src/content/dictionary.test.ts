import { describe, expect, it } from 'vitest';
import { cleanDictionarySenses, inferDictionaryPos, shortGloss, weightForRank } from './dictionary';

const PARTIAL_RAW = '1. Of, pertaining to, or affecting, a part only; not general or universal; not total or entire; as, a partial eclipse of the moon. "Partial dissolutions of the earth." T. Burnet. 2. Inclined to favor one party in a cause, or one side of a question, more then the other; baised; not indifferent; as, a judge should not be partial. Ye have been partial in the law. Mal. ii. 9. 3. Having a predelection for; inclined to favor unreasonably; foolishly fond. "A partial parent." Pope. Not partial to an ostentatious display. Sir W. Scott. 4. (Bot.) Pertaining to a subordinate portion; as, a compound umbel is made up of a several partial umbels; a leaflet is often supported by a partial petiole. See, also, Tone.';

describe('dicionario validado', () => {
  it('limpa Defn e preserva todos os sentidos', () => {
    const raw = 'Defn: Pertaining to anarchy; without rule or government;\nin political confusion. [R.]\n\nDefn: A second sense. Shak.';
    const senses = cleanDictionarySenses(raw);
    expect(senses).toEqual([
      'Pertaining to anarchy; without rule or government; in political confusion.',
      'A second sense.',
    ]);
  });

  it('infere classe gramatical sem inventar classe', () => {
    expect(inferDictionaryPos('Defn: To reduce to anarchy.')).toBe('verb');
    expect(inferDictionaryPos('Defn: A genus of mosquitoes.')).toBe('noun');
    expect(inferDictionaryPos('Defn: Pertaining to anarchy.')).toBe('adj');
    expect(inferDictionaryPos('Defn: Something obscure.')).toBe('unknown');
  });

  it('pondera frequencia conhecida acima do resto', () => {
    expect(weightForRank(1)).toBeGreaterThan(weightForRank(1000));
    expect(weightForRank(1000)).toBeGreaterThan(weightForRank(null));
  });

  it('remove autores e referencias sem perder sentidos', () => {
    const raw = 'Defn: First meaning. Chaucer. Second meaning. Milton. Third meaning. Gen. xxvii. 21.';
    expect(cleanDictionarySenses(raw)).toEqual([
      'First meaning. Second meaning. Third meaning.',
    ]);
  });

  it('reduz o gloss a uma frase curta', () => {
    expect(shortGloss(['Pertaining to anarchy; without rule or government.'])).toBe('Pertaining to anarchy');
    expect(shortGloss(['A very long definition with many words.']).length).toBeLessThanOrEqual(120);
  });

  it('remove citações e referências do caso partial', () => {
    const senses = cleanDictionarySenses(PARTIAL_RAW);
    expect(senses.join(' ')).not.toMatch(/T\. Burnet|Pope|Sir W\. Scott|Mal\.|See, also/);
    expect(shortGloss(senses)).toBe('Of, pertaining to, or affecting, a part only');
  });

});
