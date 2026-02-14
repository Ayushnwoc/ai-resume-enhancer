import type { LLMProvider } from '@/types';
import type { IAIProvider } from './types';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { GeminiProvider } from './gemini-provider';
import { GrokProvider } from './grok-provider';

export interface ProviderConfig {
  apiKey: string;
  model?: string;
}

type ProviderConstructor = new (apiKey: string, model?: string) => IAIProvider;

const registry = new Map<LLMProvider, ProviderConstructor>([
  ['openai', OpenAIProvider],
  ['anthropic', AnthropicProvider],
  ['gemini', GeminiProvider],
  ['grok', GrokProvider],
]);

/**
 * Get an AI provider instance by name.
 *
 * Open/Closed Principle: to add a new provider:
 * 1. Create a class extending BaseAIProvider (implement enhance(), optionally listModels()).
 * 2. Add it to the registry map below (and extend LLMProvider in types/index.ts if needed).
 * No changes to chunk-enhancer, API routes, or other providers required.
 */
export function getAIProvider(provider: LLMProvider, config: ProviderConfig): IAIProvider {
  const Constructor = registry.get(provider);
  if (!Constructor) {
    throw new Error(`Unsupported provider: ${provider}. Registered: ${Array.from(registry.keys()).join(', ')}`);
  }
  return new Constructor(config.apiKey, config.model);
}

/**
 * Register a new provider (e.g. for plugins or custom providers).
 * Enables adding providers without modifying existing code.
 */
export function registerProvider(
  name: LLMProvider,
  ProviderClass: ProviderConstructor
): void {
  registry.set(name, ProviderClass);
}

/** List all registered provider names. */
export function getRegisteredProviders(): LLMProvider[] {
  return Array.from(registry.keys());
}
