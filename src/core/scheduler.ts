import { DefaultScheduler } from 'ts-fsrs';
import type { RatingValue } from './rewards';

export interface CardState {
  cardId: string;
  state: number;
  stability: number;
  stabilityFast: number;
  difficulty: number;
  dueAt: Date;
  lastReviewAt: Date | null;
  reps: number;
  lapses: number;
  scheduledDays: number;
  learningStep: number;
  scheduleStatus: string;
}

export interface ReviewLogState {
  cardId: string;
  rating: number;
  reviewTime: Date;
  state: number;
  stability: number;
  stabilityFast: number;
  difficulty: number;
  dueAt: Date;
  scheduledDays: number;
  learningStep: number;
  scheduleStatus: string;
}

export interface Scheduler {
  newCard(itemId: string, now: Date): CardState;
  preview(card: CardState, now: Date): RatingValue[];
  review(card: CardState, grade: RatingValue, now: Date): { card: CardState; revlog: ReviewLogState };
}

interface FsrsCard {
  cardId: string | number;
  state: number;
  stability: number;
  stabilityFast: number;
  difficulty: number;
  dueAt: Date;
  lastReviewAt: Date | null;
  reps: number;
  lapses: number;
  scheduledDays: number;
  learningStep: number;
  scheduleStatus: string;
}

interface FsrsRevlog {
  cardId: string | number;
  rating: number;
  reviewTime: Date;
  state: number;
  stability: number;
  stabilityFast: number;
  difficulty: number;
  dueAt: Date;
  scheduledDays: number;
  learningStep: number;
  scheduleStatus: string;
}

interface FsrsScheduler {
  newCard(input: { cardId: string; now: Date }): FsrsCard;
  preview(input: { card: FsrsCard; now: Date }): Array<{ grade: number }>;
  review(input: { card: FsrsCard; grade: number; now: Date }): { card: FsrsCard; revlog: FsrsRevlog };
}

const fromCard = (card: FsrsCard): CardState => ({
  cardId: String(card.cardId),
  state: card.state,
  stability: card.stability,
  stabilityFast: card.stabilityFast,
  difficulty: card.difficulty,
  dueAt: card.dueAt,
  lastReviewAt: card.lastReviewAt,
  reps: card.reps,
  lapses: card.lapses,
  scheduledDays: card.scheduledDays,
  learningStep: card.learningStep,
  scheduleStatus: card.scheduleStatus,
});

const toCard = (card: CardState): FsrsCard => ({
  cardId: card.cardId,
  state: card.state,
  stability: card.stability,
  stabilityFast: card.stabilityFast,
  difficulty: card.difficulty,
  dueAt: card.dueAt,
  lastReviewAt: card.lastReviewAt,
  reps: card.reps,
  lapses: card.lapses,
  scheduledDays: card.scheduledDays,
  learningStep: card.learningStep,
  scheduleStatus: card.scheduleStatus,
});

export const createScheduler = async (): Promise<Scheduler> => {
  const scheduler = await DefaultScheduler({
    version: 'FSRS-7',
    desiredRetention: 0.9,
    enableShortTerm: true,
    learningSteps: ['1m', '10m'],
    relearningSteps: ['10m'],
    enableFuzz: false,
    maximumInterval: 36_500,
  }) as unknown as FsrsScheduler;

  return {
    newCard: (itemId, now) => fromCard(scheduler.newCard({ cardId: itemId, now })),
    preview: (card, now) => scheduler.preview({ card: toCard(card), now }).map((candidate) => candidate.grade as RatingValue),
    review: (card, grade, now) => {
      const result = scheduler.review({ card: toCard(card), grade, now });
      return {
        card: fromCard(result.card),
        revlog: {
          cardId: String(result.revlog.cardId),
          rating: result.revlog.rating,
          reviewTime: result.revlog.reviewTime,
          state: result.revlog.state,
          stability: result.revlog.stability,
          stabilityFast: result.revlog.stabilityFast,
          difficulty: result.revlog.difficulty,
          dueAt: result.revlog.dueAt,
          scheduledDays: result.revlog.scheduledDays,
          learningStep: result.revlog.learningStep,
          scheduleStatus: result.revlog.scheduleStatus,
        },
      };
    },
  };
};
