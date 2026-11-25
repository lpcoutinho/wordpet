export type Pos = 'noun' | 'verb' | 'adj' | 'adv' | 'article' | 'prep' | 'pronoun' | 'conj' | 'unknown';

export interface SenseDefinition {
  index: string;
  text: string;
  senseIds: string[];
  examples: string[];
}

export interface TranslationBlock {
  pos: Pos;
  gloss: string;
  terms: string[];
  preferred: string[];
  notUsed: boolean;
  sourcePage: string;
  revid: number;
  revTimestamp: string;
}

export interface PageRecord {
  title: string;
  revid: number;
  rev_timestamp: string;
  source_page: string;
  wikitext: string;
  wikitext_sha256: string;
}

export interface ContentCandidate {
  key: string;
  lemma: string;
  rank: number;
  pos: Pos;
  senseIndex: string;
  definitionEn: string | null;
  exampleEn: string | null;
  examplesEn: string[];
  pt: string | null;
  ptCandidates: string[];
  status: 'ok' | 'pending_no_example' | 'pending_unlinked' | 'pending_function_word';
  matchConfidence: 'high' | 'medium' | 'unlinked';
  sourceId: string;
  sourceUrl: string;
  sourcePage: string;
  revid: number;
  revTimestamp: string;
  license: string;
  retrievedAt: string;
}

const POS_NAMES: Array<[RegExp, Pos]> = [
  [/^noun/i, 'noun'],
  [/^verb/i, 'verb'],
  [/^adj(?:ective)?/i, 'adj'],
  [/^adv(?:erb)?/i, 'adv'],
  [/^article/i, 'article'],
  [/^prep(?:osition)?/i, 'prep'],
  [/^pronoun/i, 'pronoun'],
  [/^conj(?:unction)?/i, 'conj'],
];

const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'for', 'on', 'or', 'and', 'is', 'be',
  'with', 'that', 'this', 'it', 'as', 'at', 'by', 'from', 'used', 'something',
]);

const templateEnd = (text: string, start: number): number => {
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text.startsWith('{{', index)) {
      depth += 1;
      index += 1;
      continue;
    }
    if (text.startsWith('}}', index)) {
      depth -= 1;
      index += 1;
      if (depth === 0) return index + 1;
    }
  }
  return text.length;
};

const splitParams = (text: string): string[] => {
  const parts: string[] = [];
  let current = '';
  let index = 0;
  while (index < text.length) {
    if (text.startsWith('{{', index)) {
      const end = templateEnd(text, index);
      current += text.slice(index, end);
      index = end;
      continue;
    }
    if (text[index] === '|') {
      parts.push(current);
      current = '';
      index += 1;
      continue;
    }
    current += text[index];
    index += 1;
  }
  parts.push(current);
  return parts;
};

export const flattenTemplates = (text: string): string => {
  let result = '';
  let index = 0;
  while (index < text.length) {
    if (text.startsWith('{{', index)) {
      const end = templateEnd(text, index);
      const params = splitParams(text.slice(index + 2, end - 2));
      const name = (params[0] ?? '').trim().toLowerCase();
      if (name === 'non-gloss') result += params.slice(1).join('|');
      index = end;
      continue;
    }
    result += text[index];
    index += 1;
  }
  return result;
};

export const cleanWikitext = (text: string): string =>
  flattenTemplates(text)
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&emsp;/g, ' ')
    .replace(/'{2,5}/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const EXAMPLE_TEMPLATES = new Set(['ux', 'uxi', 'usex', 'example', 'eg']);

const extractExampleText = (templateBody: string): string | null => {
  const params = splitParams(templateBody);
  const name = (params[0] ?? '').trim().toLowerCase();
  if (!EXAMPLE_TEMPLATES.has(name)) return null;
  const langIndex = params.findIndex((param, index) => index > 0 && param.trim().toLowerCase() === 'en');
  if (langIndex < 0) return null;
  const text = params.slice(langIndex + 1).find((param) => param.trim() && !/^[A-Za-z_-]+\s*=/.test(param.trim()));
  return text ? cleanWikitext(text) : null;
};

const extractExamplesFromLine = (line: string): string[] => {
  const examples: string[] = [];
  let index = 0;
  while (index < line.length) {
    if (line.startsWith('{{', index)) {
      const end = templateEnd(line, index);
      const example = extractExampleText(line.slice(index + 2, end - 2));
      if (example) examples.push(example);
      index = end;
      continue;
    }
    index += 1;
  }
  return examples;
};

const splitByHeading = (text: string, level: number): Array<{ name: string; body: string }> => {
  const regex = new RegExp(`^={${level}}([^=\\n]+)={${level}}\\s*$`, 'gm');
  const headings: Array<{ name: string; start: number; bodyStart: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    headings.push({ name: match[1].trim(), start: match.index, bodyStart: match.index + match[0].length });
  }
  return headings.map((heading, index) => ({
    name: heading.name,
    body: text.slice(heading.bodyStart, index + 1 < headings.length ? headings[index + 1].start : text.length),
  }));
};

const posFromHeading = (name: string): Pos | null => {
  for (const [pattern, pos] of POS_NAMES) if (pattern.test(name)) return pos;
  return null;
};

export const englishSection = (wikitext: string): string =>
  splitByHeading(wikitext, 2).find((section) => section.name.toLowerCase() === 'english')?.body ?? '';

export const posSections = (text: string): Array<{ pos: Pos; body: string }> => {
  const regex = /^(={3,4})([^=\n]+)\1\s*$/gm;
  const headings: Array<{ pos: Pos; start: number; bodyStart: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const pos = posFromHeading(match[2].trim());
    if (pos) headings.push({ pos, start: match.index, bodyStart: match.index + match[0].length });
  }
  return headings.map((heading, index) => ({
    pos: heading.pos,
    body: text.slice(heading.bodyStart, index + 1 < headings.length ? headings[index + 1].start : text.length),
  }));
};

export const extractDefinitions = (body: string): SenseDefinition[] => {
  const definitions: SenseDefinition[] = [];
  const byIndex = new Map<string, SenseDefinition>();
  let major = 0;
  let minor = 0;
  for (const line of body.split('\n')) {
    const definitionMatch = /^(#{1,2})\s+(.+)$/.exec(line);
    if (definitionMatch) {
      const level = definitionMatch[1].length;
      if (level === 1) {
        major += 1;
        minor = 0;
      } else {
        minor += 1;
      }
      const index = level === 1 ? `s${major}` : `s${major}.${minor}`;
      const senseIds = [...line.matchAll(/\{\{\s*(?:senseid|sid)\|en\|([^}|]+)/gi)].map((entry) => entry[1].trim().toLowerCase());
      const text = cleanWikitext(definitionMatch[2]);
      if (!text) continue;
      const definition: SenseDefinition = { index, text, senseIds, examples: [] };
      definitions.push(definition);
      byIndex.set(index, definition);
      continue;
    }
    const exampleMatch = /^(#{1,2})(?:\*|:)\s+(.+)$/.exec(line);
    if (!exampleMatch) continue;
    const level = exampleMatch[1].length;
    const index = level === 1 ? `s${major}` : `s${major}.${minor}`;
    const definition = byIndex.get(index);
    if (!definition) continue;
    definition.examples.push(...extractExamplesFromLine(exampleMatch[2]));
  }
  return definitions;
};

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokens = (value: string): string[] =>
  normalise(value).split(' ').filter((token) => token.length > 1 && !STOPWORDS.has(token));

export const matchSense = (
  gloss: string,
  definitions: SenseDefinition[],
): { definition: SenseDefinition | null; confidence: 'high' | 'medium' } => {
  const glossNorm = normalise(gloss);
  const glossTokens = tokens(gloss);
  for (const definition of definitions) {
    const definitionNorm = normalise(definition.text);
    if (glossNorm.length > 3 && (definitionNorm === glossNorm || definitionNorm.startsWith(glossNorm))) {
      return { definition, confidence: 'high' };
    }
    if (definition.senseIds.some((id) => glossNorm.includes(id))) {
      return { definition, confidence: 'high' };
    }
  }
  let best: { definition: SenseDefinition; score: number } | null = null;
  for (const definition of definitions) {
    const definitionTokens = tokens(definition.text);
    const shared = definitionTokens.filter((token) => glossTokens.includes(token));
    const union = new Set([...definitionTokens, ...glossTokens]).size;
    const score = union === 0 ? 0 : shared.length / union;
    if ((shared.length >= 2 || score >= 0.5) && (!best || score > best.score)) best = { definition, score };
  }
  return best ? { definition: best.definition, confidence: 'medium' } : { definition: null, confidence: 'medium' };
};

export const extractTranslationBlocks = (text: string, source: PageRecord): TranslationBlock[] => {
  const blocks: TranslationBlock[] = [];
  const sections = posSections(text);
  const targets = sections.length > 0 ? sections : [{ pos: 'noun' as Pos, body: text }];
  for (const section of targets) {
    const regex = /\{\{trans-(?:top|top-see)[^{}]*\}\}([\s\S]*?)\{\{trans-bottom\}\}/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(section.body)) !== null) {
      const glossMatch = /\{\{trans-(?:top|top-see)\|([^|}]+)/.exec(match[0]);
      const gloss = cleanWikitext(glossMatch?.[1] ?? '');
      const lineMatch = /(?:^|\n)\s*\*?\s*Portuguese:\s*([^\n]*)/.exec(match[1]);
      const line = lineMatch?.[1] ?? '';
      const templates = [...line.matchAll(/\{\{(t|tt)(\+?)\|pt\|([^|}]+)[^}]*\}\}/gi)];
      const terms = templates.map((entry) => cleanWikitext(entry[3]));
      const preferred = templates.filter((entry) => entry[2] === '+').map((entry) => cleanWikitext(entry[3]));
      blocks.push({
        pos: section.pos,
        gloss,
        terms,
        preferred,
        notUsed: /\{\{\s*not used\|pt\s*\}\}/i.test(line),
        sourcePage: source.source_page,
        revid: source.revid,
        revTimestamp: source.rev_timestamp,
      });
    }
  }
  return blocks;
};

export const buildCandidates = (
  lemma: string,
  rank: number,
  definitions: Map<Pos, SenseDefinition[]>,
  blocks: TranslationBlock[],
  retrievedAt: string,
  source?: Pick<PageRecord, 'source_page' | 'revid' | 'rev_timestamp'>,
): ContentCandidate[] => {
  const candidates: ContentCandidate[] = [];
  const functionWords: Pos[] = ['article', 'prep', 'pronoun', 'conj'];
  const primaryByPos = new Map<Pos, TranslationBlock>();
  for (const block of blocks) if (!primaryByPos.has(block.pos)) primaryByPos.set(block.pos, block);
  const positions = new Set<Pos>([...primaryByPos.keys(), ...definitions.keys()]);
  for (const pos of positions) {
    const block = primaryByPos.get(pos);
    const senses = definitions.get(pos) ?? [];
    const matched = block ? matchSense(block.gloss, senses) : { definition: null, confidence: 'unlinked' as const };
    const definition = matched.definition ?? senses.find((sense) => sense.examples.length > 0) ?? senses[0] ?? null;
    const examples = definition?.examples ?? [];
    const pick = block?.preferred[0] ?? block?.terms[0] ?? null;
    const status: ContentCandidate['status'] = functionWords.includes(pos)
      ? 'pending_function_word'
      : !definition
        ? 'pending_unlinked'
        : examples.length === 0
          ? 'pending_no_example'
          : 'ok';
    const sourcePage = source?.source_page ?? block?.sourcePage ?? lemma;
    const revid = source?.revid ?? block?.revid ?? 0;
    const revTimestamp = source?.rev_timestamp ?? block?.revTimestamp ?? retrievedAt;
    candidates.push({
      key: `${lemma}|${pos}|${definition?.index ?? 's1'}`,
      lemma,
      rank,
      pos,
      senseIndex: definition?.index ?? 's1',
      definitionEn: definition?.text ?? null,
      exampleEn: examples[0] ?? null,
      examplesEn: examples,
      pt: status === 'ok' ? pick : null,
      ptCandidates: block?.terms ?? [],
      status,
      matchConfidence: matched.definition ? matched.confidence : 'unlinked',
      sourceId: 'en_wiktionary',
      sourceUrl: `https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(sourcePage)}&oldid=${revid}`,
      sourcePage,
      revid,
      revTimestamp,
      license: 'CC-BY-SA-4.0',
      retrievedAt,
    });
  }
  return candidates;
};
