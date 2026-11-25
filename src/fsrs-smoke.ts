import { DefaultScheduler, Rating } from 'ts-fsrs';

export interface FsrsSmokeResult {
  cardId: string;
  previewGrades: number[];
  goodDueAt: string;
  stability: number;
  stabilityFast: number;
  difficulty: number;
  reps: number;
}

export const runFsrsSmoke = async (now: Date): Promise<FsrsSmokeResult> => {
  const scheduler = await DefaultScheduler({
    version: 'FSRS-7',
    desiredRetention: 0.9,
    enableShortTerm: true,
    learningSteps: ['1m', '10m'],
    relearningSteps: ['10m'],
    enableFuzz: false,
    maximumInterval: 36_500,
  });

  const card = scheduler.newCard({ cardId: 'word-sense-smoke', now });
  const previewGrades = [...scheduler.preview({ card, now })].map((candidate) => candidate.grade);
  const result = scheduler.review({ card, grade: Rating.Good, now });

  return {
    cardId: String(result.card.cardId),
    previewGrades,
    goodDueAt: result.card.dueAt.toISOString(),
    stability: result.card.stability,
    stabilityFast: result.card.stabilityFast,
    difficulty: result.card.difficulty,
    reps: result.card.reps,
  };
};
