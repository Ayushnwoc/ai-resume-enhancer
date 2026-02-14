import type { LLMResponse, TokenUsage } from '@/types';

/**
 * Input for resume enhancement: file data + prompt.
 * Provider-specific handling is encapsulated inside each provider.
 */
export interface EnhancementInput {
  file: File;
  base64File: string;
  mimeType: string;
  prompt: string;
  model?: string;
}

/**
 * Model info returned by listModels().
 */
export interface ModelInfo {
  id: string;
  name: string;
  status?: 'free' | 'paid' | 'exhausted' | 'unknown';
  isFree?: boolean;
}

/**
 * Contract for all AI providers (Open/Closed Principle).
 * To add a new provider: create a class extending BaseAIProvider and register it.
 * No changes to existing code required.
 */
export interface IAIProvider {
  /** Run resume enhancement with the given input; returns content + token usage. */
  enhance(input: EnhancementInput): Promise<LLMResponse>;
  /** List available models for this provider (optional). */
  listModels?(apiKey: string): Promise<ModelInfo[]>;
}

export type { LLMResponse, TokenUsage };
