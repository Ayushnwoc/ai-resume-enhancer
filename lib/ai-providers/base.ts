import type { IAIProvider, EnhancementInput, ModelInfo } from './types';
import type { LLMResponse } from '@/types';

/**
 * Abstract base for all AI providers (Open/Closed Principle).
 * Add a new provider by extending this class and implementing enhance().
 * Then register the class in the provider registry; AIProvider can use it directly.
 */
export abstract class BaseAIProvider implements IAIProvider {
  constructor(
    protected readonly apiKey: string,
    protected readonly defaultModel?: string
  ) {}

  /**
   * Run resume enhancement. Each provider implements its own API calls and payload shape.
   */
  abstract enhance(input: EnhancementInput): Promise<LLMResponse>;

  /**
   * Optional: list models for this provider. Override in subclass if the provider supports it.
   */
  async listModels?(_apiKey: string): Promise<ModelInfo[]> {
    return [];
  }

  /** Resolve model: input override or default. */
  protected getModel(inputModel?: string): string {
    return inputModel?.trim() || this.defaultModel || '';
  }
}
