import type { Item } from './item';

export interface WordLookup {
  itemId: string;
  lemma: string;
  glossEn: string;
}

export const buildWordIndex = (items: Item[]): Map<string, WordLookup> => {
  const index = new Map<string, WordLookup>();
  for (const item of items) {
    const key = item.lemma.toLowerCase();
    if (!key || index.has(key)) continue;
    index.set(key, { itemId: item.id, lemma: item.lemma, glossEn: item.glossEn });
  }
  return index;
};

const stemCandidates = (token: string): string[] => {
  const candidates: string[] = [];
  if (token.endsWith('ies') && token.length > 4) candidates.push(`${token.slice(0, -3)}y`);
  if (token.endsWith('es') && token.length > 3) candidates.push(token.slice(0, -2), token.slice(0, -1));
  if (token.endsWith('s') && token.length > 3) candidates.push(token.slice(0, -1));
  if (token.endsWith('ed') && token.length > 4) candidates.push(token.slice(0, -2), token.slice(0, -1));
  if (token.endsWith('ing') && token.length > 5) candidates.push(token.slice(0, -3), `${token.slice(0, -3)}e`);
  return candidates;
};

export const resolveTappedWord = (raw: string, index: Map<string, WordLookup>): WordLookup | null => {
  const token = raw.toLowerCase().replace(/[^a-z'-]/g, '');
  if (!token) return null;
  const exact = index.get(token);
  if (exact) return exact;
  for (const candidate of stemCandidates(token)) {
    const match = index.get(candidate);
    if (match) return match;
  }
  return null;
};
