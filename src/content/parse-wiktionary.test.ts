import { describe, expect, it } from 'vitest';
import {
  buildCandidates,
  englishSection,
  extractDefinitions,
  extractTranslationBlocks,
  type PageRecord,
} from './parse-wiktionary';

const page = (title: string, wikitext: string): PageRecord => ({
  title,
  revid: 1,
  rev_timestamp: '2026-11-18T21:22:24Z',
  source_page: title,
  wikitext,
  wikitext_sha256: 'test',
});

const houseMain = `{{also|House}}
==English==

===Noun===
# A structure built or serving as an abode of human beings.
#* {{ux|en|They lived in a small '''house''' near the river.}}
# {{lb|en|figurative}} A family or household.
`;

const houseTranslations = `{{translation subpage}}
==English==

===Noun===

====Translations====
{{trans-top-see|human abode|housing}}
{{multitrans|data=
* Abau: {{tt|aau|a}}
* Portuguese: {{tt+|pt|casa|f}}
{{trans-bottom}}
`;

const theMain = `==English==

===Article===
# Used before a noun to indicate a particular thing.

====Translations====
{{trans-top|used before a noun}}
* Portuguese: {{t+|pt|o|m}}, {{t+|pt|a|f}}
{{trans-bottom}}
`;

describe('parser de wikitext da Wiktionary', () => {
  it('extrai definicoes limitadas a secao English e limpa templates', () => {
    const definitions = extractDefinitions(englishSection(houseMain));
    expect(definitions).toHaveLength(2);
    expect(definitions[0]?.index).toBe('s1');
    expect(definitions[0]?.text).toContain('A structure built');
    expect(definitions[1]?.text).toBe('A family or household.');
    expect(definitions[0]?.examples[0]).toBe('They lived in a small house near the river.');
  });

  it('extrai Portuguese de subpagina de traducoes com tt+', () => {
    const blocks = extractTranslationBlocks(englishSection(houseTranslations), page('house/translations', houseTranslations));
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.pos).toBe('noun');
    expect(blocks[0]?.gloss).toBe('human abode');
    expect(blocks[0]?.preferred).toEqual(['casa']);
    expect(blocks[0]?.terms).toEqual(['casa']);
  });

  it('associa o sentido e gera um cartao aprovado', () => {
    const definitions = new Map([['noun' as const, extractDefinitions(englishSection(houseMain))]]);
    const blocks = extractTranslationBlocks(englishSection(houseTranslations), page('house/translations', houseTranslations));
    const [candidate] = buildCandidates('house', 42, definitions, blocks, '2026-11-25T00:00:00Z');
    expect(candidate?.status).toBe('ok');
    expect(candidate?.pt).toBe('casa');
    expect(candidate?.definitionEn).toContain('A structure built');
    expect(candidate?.exampleEn).toContain('They lived in a small house');
    expect(candidate?.sourceUrl).toContain('oldid=1');
    expect(candidate?.license).toBe('CC-BY-SA-4.0');
  });

  it('marca artigos como pendentes sem publicar traducao', () => {
    const definitions = new Map([['article' as const, extractDefinitions(englishSection(theMain))]]);
    const blocks = extractTranslationBlocks(englishSection(theMain), page('the', theMain));
    const [candidate] = buildCandidates('the', 1, definitions, blocks, '2026-11-25T00:00:00Z');
    expect(candidate?.status).toBe('pending_function_word');
    expect(candidate?.pt).toBeNull();
  });

  it('aprova o sentido com exemplo mesmo quando a traducao nao e usada', () => {
    const wikitext = `==English==\n\n===Noun===\n# Definition.\n#* {{ux|en|This is a definition example.}}\n\n====Translations====\n{{trans-top|definition}}\n* Portuguese: {{not used|pt}}\n{{trans-bottom}}\n`;
    const definitions = new Map([['noun' as const, extractDefinitions(englishSection(wikitext))]]);
    const blocks = extractTranslationBlocks(englishSection(wikitext), page('x', wikitext));
    const candidates = buildCandidates('x', 1, definitions, blocks, '2026-11-25T00:00:00Z');
    expect(candidates[0]?.status).toBe('ok');
    expect(candidates[0]?.exampleEn).toBe('This is a definition example.');
    expect(candidates[0]?.pt).toBeNull();
  });

  it('mantem pendente o sentido sem exemplo em ingles', () => {
    const wikitext = `==English==\n\n===Noun===\n# Definition only.\n`;
    const definitions = new Map([['noun' as const, extractDefinitions(englishSection(wikitext))]]);
    const [candidate] = buildCandidates('x', 1, definitions, [], '2026-11-25T00:00:00Z');
    expect(candidate?.status).toBe('pending_no_example');
    expect(candidate?.exampleEn).toBeNull();
  });
});
