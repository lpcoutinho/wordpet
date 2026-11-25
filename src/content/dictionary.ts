import type { Pos } from './types';

const AUTHOR_NAMES = [
  'Addison', 'Arbuthnot', 'Bailey', 'Barrow', 'Barlow', 'Blackstone', 'Bouvier', 'Boyle',
  'Bray', 'Browne', 'Browning', 'Bryant', 'Burnet', 'Burke', 'Burton', 'Byron', 'Carlyle',
  'Chapman', 'Chaucer', 'Coleridge', 'Cowper', 'Cudworth', 'Darwin', 'Dickens', 'Donne',
  'Drayton', 'Dryden', 'Dunglison', 'Emerson', 'Evelyn', 'Eliot', 'Fl', 'Franklin', 'Fuller',
  'Glanvill', 'Glover', 'Goldsmith', 'Gray', 'Grew', 'Halliwell', 'Hamilton', 'Hammond',
  'Hawthorne', 'Hale', 'Hall', 'Hogg', 'Holland', 'Hooker', 'Howell', 'Hudibras', 'Hunt',
  'Irving', 'Jonson', 'Johnson', 'Keble', 'Kingsley', 'Knight', 'Landor', 'Locke',
  'Longfellow', 'Lowell', 'Macaulay', 'Marston', 'Milton', 'Montagu', 'More', 'Plowman',
  'Pope', 'Prior', 'Quincey', 'Rankine', 'Ray', 'Robynson', 'Scott', 'Shak', 'Sidney',
  'Smith', 'South', 'Southey', 'Spenser', 'Swift', 'Syn', 'Taylor', 'Tennyson', 'Thackeray',
  'Totten', 'Tyndale', 'Tyn', 'Ure', 'Wotton', 'Wright', 'Wordsworth', 'Wyclif', 'Wycliffe',
  'Young',
].join('|');

const CITATION_PREFIX = String.raw`(^|[.!?]["”’]?\s+)`;
const CITATION_TITLES = String.raw`(?:(?:Bp|Dr|Hon|Lord|Piers|Prof|Sir|St|T|W)\.?\s+){0,3}`;
const CITATION = new RegExp(
  `${CITATION_PREFIX}${CITATION_TITLES}(?:${AUTHOR_NAMES})(?:\\s+[A-Z][a-z]+)?\\.?(?=\\s|$|[,;])`,
  'g',
);

const SCRIPTURE = new RegExp(
  String.raw`(^|[.!?]\s+)(?:1 Cor|2 Cor|1 Chron|2 Chron|1 John|1 Kings|1 Pet|1 Sam|1 Thess|1 Tim|2 John|2 Kings|2 Pet|2 Sam|2 Thess|2 Tim|Acts|Amos|Cant|Col|Dan|Deut|Eccl|Eph|Esth|Exod|Ezek|Ezra|Gal|Gen|Hab|Hag|Heb|Hos|Isa|Jas|Jer|Job|Joel|John|Jonah|Josh|Judg|Jude|Lam|Lev|Luke|Mal|Mark|Matt|Mic|Nah|Neh|Num|Obad|Phil|Prov|Ps|Rev|Rom|Ruth|Zech|Zeph)(?:\.?\s+(?:\d+[:.]\d+|\d+|[ivxlcdm]+\.?\s+\d+|[ivxlcdm]+))(?:\s*[,;]\s*\d+(?::\d+)?)?\.?`,
  'gi',
);

const cleanSense = (block: string): string => {
  const cleaned = block
    .replace(/^\s*Defn:\s*/i, '')
    .replace(/^\s*(?:\d+\.|\([a-z]\))\s*/i, '')
    .replace(/Etym:[\s\S]*?(?=Defn:|\d+\.|$)/gi, '')
    .replace(/Note:[\s\S]*$/gi, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/See(?:,\s*also)?,?\s+[A-Z][^.]*\.?/g, '')
    .replace(SCRIPTURE, (match, prefix: string) => prefix)
    .replace(CITATION, (match, prefix: string) => prefix)
    .replace(/\s+/g, ' ')
    .replace(/\s+--\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .trim();
  return cleaned;
};

export const cleanDictionarySenses = (raw: string): string[] => {
  if (!raw?.trim()) return [];
  const blocks = raw.split(/\n\s*\n/).map(cleanSense).filter(Boolean);
  return blocks.length > 0 ? blocks : [cleanSense(raw)].filter(Boolean);
};

export const shortGloss = (senses: string[], maxChars = 120): string => {
  const first = senses[0]?.trim() ?? '';
  if (!first) return '';
  const clause = first.match(/^.*?[.;:](?=\s|$)/)?.[0]?.trim() ?? first;
  const sentence = clause.replace(/[;:,.]+$/, '').trim();
  if (sentence.length <= maxChars) return sentence;
  const clipped = sentence.slice(0, maxChars - 1).replace(/\s+\S*$/, '');
  return `${clipped}…`;
};

export const inferDictionaryPos = (raw: string): Pos => {
  const value = raw.replace(/^\s*Defn:\s*/i, '');
  if (/^To\s/i.test(value)) return 'verb';
  if (/^(?:A|An|The)\s+(?:kind|genus|species|person|one|structure|plant|animal|bird|fish|insect|instrument|machine|place|city|town|river|mountain|country|state|office|act|state|quality|condition|doctrine|practice|system|science|art|branch|division|class|group|member|thing|substance|liquid|solid|powder|medicine|remedy|disease)\b/i.test(value)) return 'noun';
  if (/^(?:One|Someone|A person|Any person|He who|She who)\b/i.test(value)) return 'noun';
  if (/^(?:Of|Pertaining|Relating|Characteristic|Capable|Tending|Having|Not|Full|Free|Consisting|Marked|Resembling)\b/i.test(value)) return 'adj';
  if (/^(?:In|On|At|By|With|During|Through|Across|Along|Before|After)\b/i.test(value)) return 'prep';
  if (/^(?:Hence|Thus|Now|Then|Very|Quite|Chiefly|Especially|Generally)\b/i.test(value)) return 'adv';
  return 'unknown';
};

export const weightForRank = (rank: number | null): number => {
  if (rank === null || !Number.isFinite(rank) || rank <= 0) return 0.05;
  return Math.max(1, 101 - Math.floor((rank - 1) / 100));
};
