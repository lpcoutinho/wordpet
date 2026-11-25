export type Pos = 'noun' | 'verb' | 'adj' | 'adv' | 'article' | 'prep' | 'pronoun' | 'conj' | 'unknown';

export interface PackItem {
  id: string;
  rank: number;
  frequency_rank: number | null;
  weight: number;
  lemma: string;
  pos: Pos;
  sense_index: string;
  definition_en: string | null;
  prompt_en: string;
  gloss_en: string;
  example_en: string | null;
  examples_en: string[];
  translation_ptbr: string;
  status: 'ok';
  match_confidence: 'high' | 'medium' | 'unlinked';
  source_id: string;
  source_url: string;
  source_page: string;
  revid: number;
  rev_timestamp: string;
  license: string;
  retrieved_at: string;
  attribution: string;
  translation_candidates: string[];
}

export interface ContentPack {
  version: string;
  built_at: string;
  checksum: string;
  source: {
    wordlist: string;
    translations: string;
    examples: string;
    license: string;
    word_limit: number;
    pack_limit: number;
    primary_source: string;
    validation_source: string;
    entry_count: number;
    frequency_weighted: boolean;
  };
  items: PackItem[];
}
