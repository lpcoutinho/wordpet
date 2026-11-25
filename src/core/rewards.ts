export type RatingValue = 1 | 2 | 3 | 4;

export interface Answer {
  revealed: boolean;
  correct: boolean;
}

export const ratingFor = (answer: Answer): RatingValue => {
  if (!answer.correct) return 1;
  return answer.revealed ? 2 : 3;
};

export const awardFor = (answer: Answer): number =>
  !answer.revealed && answer.correct ? 10 : 0;
