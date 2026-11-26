const DAY_MS = 86_400_000;

export interface GameplayEvent {
  event_id: string;
  name: 'review' | 'answer' | 'exposure' | 'xp_award';
  item_id: string;
  occurred_at: string;
  schema_version: string;
  pack_version: string;
  payload: Record<string, unknown>;
}

export interface RecallSummary {
  correct: number;
  total: number;
  rate: number | null;
}

export interface Metrics {
  delayed_recall_1d: RecallSummary;
  delayed_recall_7d: RecallSummary;
  xp_total: number;
  answers: number;
  by_format: Record<string, number>;
  by_rating: Record<string, number>;
}

const summarise = (events: GameplayEvent[], minimumDays: number): RecallSummary => {
  const scheduled = events.filter((event) => event.name === 'answer' && event.payload.scheduled === true);
  const relevant = scheduled.filter((event) => {
    const previousDue = event.payload.previous_due_at;
    if (typeof previousDue !== 'string') return false;
    const delay = (Date.parse(event.occurred_at) - Date.parse(previousDue)) / DAY_MS;
    return delay >= minimumDays;
  });
  const correct = relevant.filter((event) => event.payload.correct === true).length;
  return {
    correct,
    total: relevant.length,
    rate: relevant.length === 0 ? null : correct / relevant.length,
  };
};

const tally = (events: GameplayEvent[], key: string): Record<string, number> =>
  events.reduce<Record<string, number>>((counts, event) => {
    const value = event.payload[key];
    if (value === undefined || value === null) return counts;
    const label = String(value);
    counts[label] = (counts[label] ?? 0) + 1;
    return counts;
  }, {});

export const computeMetrics = (events: GameplayEvent[]): Metrics => {
  const answers = events.filter((event) => event.name === 'answer');
  return {
    delayed_recall_1d: summarise(events, 1),
    delayed_recall_7d: summarise(events, 7),
    xp_total: events
      .filter((event) => event.name === 'xp_award')
      .reduce((total, event) => total + (typeof event.payload.amount === 'number' ? event.payload.amount : 0), 0),
    answers: answers.length,
    by_format: tally(answers, 'format'),
    by_rating: tally(answers, 'rating'),
  };
};


const dayKey = (value: Date | string): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const computeStreak = (events: GameplayEvent[], now: Date = new Date()): number => {
  const activeDays = new Set(events
    .filter((event) => event.name === 'answer' && event.payload.correct === true)
    .map((event) => dayKey(event.occurred_at)));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!activeDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
