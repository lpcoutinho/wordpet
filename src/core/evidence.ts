import type { GameplayEvent } from './metrics';

const HEADERS = [
  'event_id',
  'name',
  'item_id',
  'occurred_at',
  'schema_version',
  'pack_version',
  'correct',
  'rating',
  'format',
  'amount',
  'payload_json',
] as const;

const cell = (value: unknown): string => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const TOP_LEVEL = new Set<string>([
  'event_id',
  'name',
  'item_id',
  'occurred_at',
  'schema_version',
  'pack_version',
]);

const column = (event: GameplayEvent, header: typeof HEADERS[number]): unknown => {
  if (header === 'payload_json') return JSON.stringify(event.payload);
  if (TOP_LEVEL.has(header)) return (event as unknown as Record<string, unknown>)[header];
  return event.payload[header];
};

export const evidenceCsv = (events: GameplayEvent[]): string => {
  const lines = events.map((event) => HEADERS.map((header) => cell(column(event, header))).join(','));
  return [HEADERS.join(','), ...lines].join('\n');
};
