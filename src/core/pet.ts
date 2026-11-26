import type { CardState } from './scheduler';

export type PetStage = 'egg' | 'hatchling' | 'companion' | 'guardian';

export const PET_STAGE_LABEL: Record<PetStage, string> = {
  egg: 'Egg',
  hatchling: 'Hatchling',
  companion: 'Companion',
  guardian: 'Guardian',
};

export const petStageFor = (cards: Iterable<CardState>): PetStage => {
  let best = 0;
  for (const card of cards) best = Math.max(best, card.stability);
  if (best >= 30) return 'guardian';
  if (best >= 7) return 'companion';
  if (best >= 1) return 'hatchling';
  return 'egg';
};
