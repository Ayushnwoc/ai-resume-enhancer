/**
 * Multi-provider AI system (Open/Closed Principle).
 * - Use getAIProvider(provider, config) to get an IAIProvider.
 * - To add a new provider: create a class extending BaseAIProvider, then register it in registry.ts.
 */

export { BaseAIProvider } from './base';
export { getAIProvider, registerProvider, getRegisteredProviders } from './registry';
export type { ProviderConfig } from './registry';
export type { IAIProvider, EnhancementInput, ModelInfo } from './types';
export { OpenAIProvider } from './openai-provider';
export { AnthropicProvider } from './anthropic-provider';
export { GeminiProvider } from './gemini-provider';
export { GrokProvider } from './grok-provider';
