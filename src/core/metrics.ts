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

export const computeMetrics = (events: GameplayEvent[]): Metrics => ({
  delayed_recall_1d: summarise(events, 1),
  delayed_recall_7d: summarise(events, 7),
  xp_total: events
    .filter((event) => event.name === 'xp_award')
    .reduce((total, event) => total + (typeof event.payload.amount === 'number' ? event.payload.amount : 0), 0),
  answers: events.filter((event) => event.name === 'answer').length,
});
