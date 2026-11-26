import type { ContentPack, PackItem } from '../content/types';
import { shortGloss, weightForRank } from '../content/dictionary';

export type ItemType = 'word_sense' | 'sentence' | 'idiom';

export type PromptFormat = 'choice' | 'cloze' | 'typing' | 'listening';

export interface Item {
  id: string;
  type: ItemType;
  lemma: string;
  pos: PackItem['pos'];
  senseIndex: string;
  definitionEn: string | null;
  promptEn: string;
  glossEn: string;
  sensesEn: string[];
  exampleEn: string | null;
  answerEn: string;
  weight: number;
  source: {
    id: string;
    url: string;
    license: string;
    attribution: string;
  };
}

export interface Choice {
  itemId: string;
  label: string;
}

export interface ProgressLookup {
  get(itemId: string): { dueAt: Date; reps: number } | undefined;
}

export const toItem = (packItem: PackItem): Item => {
  const definitionEn = packItem.definition_en;
  const sensesEn = definitionEn ? definitionEn.split(/\n+/).filter(Boolean) : [];
  return {
    id: packItem.id,
    type: 'word_sense',
    lemma: packItem.lemma,
    pos: packItem.pos,
    senseIndex: packItem.sense_index,
    definitionEn,
    promptEn: packItem.prompt_en || shortGloss(sensesEn),
    glossEn: packItem.gloss_en || sensesEn[0] || '',
    sensesEn,
    exampleEn: packItem.example_en,
    answerEn: packItem.lemma,
    weight: packItem.weight ?? weightForRank(packItem.frequency_rank ?? packItem.rank),
    source: {
      id: packItem.source_id,
      url: packItem.source_url,
      license: packItem.license,
      attribution: packItem.attribution,
    },
  };
};

const seed = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const playableItems = (pack: ContentPack): Item[] =>
  pack.items.filter((item) => item.status === 'ok' && Boolean(item.definition_en)).map(toItem);

export const clozeSentence = (item: Item): string | null => {
  if (!item.exampleEn) return null;
  const escaped = item.lemma.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`\\b${escaped}\\b`, 'i').exec(item.exampleEn);
  if (!match) return null;
  return `${item.exampleEn.slice(0, match.index)}______${item.exampleEn.slice(match.index + match[0].length)}`;
};

export const normalizeAnswer = (value: string): string =>
  value.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export const promptFormatFor = (item: Item, reps: number): PromptFormat => {
  if (reps >= 4) return 'typing';
  if (reps >= 2 && clozeSentence(item) !== null) return 'cloze';
  return 'choice';
};

export const buildChoices = (item: Item, pack: ContentPack, size = 4, available?: Item[]): Choice[] => {
  const sourceItems = available ?? playableItems(pack);
  const pool = sourceItems.filter(
    (candidate) => candidate.id !== item.id
      && candidate.answerEn.toLowerCase() !== item.answerEn.toLowerCase(),
  );
  const samePos = pool.filter((candidate) => candidate.pos === item.pos);
  const similar = samePos.filter((candidate) => Math.abs(candidate.answerEn.length - item.answerEn.length) <= 3);
  const source = similar.length >= size - 1 ? similar : samePos.length >= size - 1 ? samePos : pool;
  const start = seed(item.id) % Math.max(source.length, 1);
  const distractors: Choice[] = [];
  const seen = new Set([item.answerEn.toLowerCase()]);
  for (let offset = 0; offset < source.length && distractors.length < size - 1; offset += 1) {
    const candidate = source[(start + offset) % source.length]!;
    const label = candidate.answerEn.toLowerCase();
    if (seen.has(label)) continue;
    seen.add(label);
    distractors.push({ itemId: candidate.id, label: candidate.answerEn });
  }
  const choices = [...distractors, { itemId: item.id, label: item.answerEn }];
  const rotation = seed(`${item.id}:choices`) % choices.length;
  return [...choices.slice(rotation), ...choices.slice(0, rotation)];
};

const pickWeighted = (candidates: Item[], random: () => number): Item | null => {
  if (candidates.length === 0) return null;
  const weights = candidates.map((candidate) => Math.max(candidate.weight, 0.01));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random() * total;
  for (let index = 0; index < candidates.length; index += 1) {
    roll -= weights[index]!;
    if (roll <= 0) return candidates[index]!;
  }
  return candidates[candidates.length - 1]!;
};

export const nextItem = (
  items: Item[],
  progress: ProgressLookup,
  now: Date,
  random: () => number = Math.random,
): Item | null => {
  const due = items.filter((item) => {
    const state = progress.get(item.id);
    return state && state.dueAt.getTime() <= now.getTime();
  });
  const pickedDue = pickWeighted(due, random);
  if (pickedDue) return pickedDue;
  return pickWeighted(items.filter((item) => !progress.get(item.id)), random);
};
