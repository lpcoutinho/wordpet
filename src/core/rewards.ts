export type RatingValue = 1 | 2 | 3 | 4;

export interface Answer {
  revealed: boolean;
  correct: boolean;
}

export interface RatedAnswer extends Answer {
  rating: RatingValue;
}

export const ratingFor = (answer: Answer): RatingValue => {
  if (!answer.correct) return 1;
  return answer.revealed ? 2 : 3;
};

export const awardFor = (answer: RatedAnswer): number => {
  if (answer.revealed || !answer.correct) return 0;
  if (answer.rating === 4) return 15;
  if (answer.rating === 3) return 10;
  return 5;
};
