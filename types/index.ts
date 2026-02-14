export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'grok';

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface DiffChunk {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export interface DiffData {
  chunks: DiffChunk[];
  addedCount: number;
  removedCount: number;
}

export interface ScoreBreakdown {
  keywordMatching: number;
  skillAlignment: number;
  experienceRelevance: number;
  overallFit: number;
}

export interface MatchingScore {
  total: number;
  breakdown: ScoreBreakdown;
  explanation: string;
}

export interface ParsedResume {
  text: string;
  format: 'pdf' | 'docx' | 'tex';
  sections?: string[];
}

export interface EnhancementResult {
  enhancedText: string;
  diff: DiffData;
  score: MatchingScore;
  tokens: TokenUsage;
  format: 'pdf' | 'docx' | 'tex';
  modifications?: ModificationChunk[];
}

export interface LLMResponse {
  content: string;
  tokens: TokenUsage;
}

/** Suggestion action: what to add to the resume, or what to remove because it doesn't fit the job. */
export type SuggestionType = 'add' | 'remove';

export interface ModificationChunk {
  original: string;
  modified: string;
  reason?: string;
  section?: string;
  /** When present, "add" = suggest adding (modified); "remove" = suggest removing (original). */
  suggestionType?: SuggestionType;
}

export interface ChunkBasedEnhancement {
  modifications: ModificationChunk[];
  analysis: string;
  score: MatchingScore;
}

