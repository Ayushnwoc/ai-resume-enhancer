import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base';
import type { EnhancementInput, ModelInfo } from './types';
import type { LLMResponse } from '@/types';

export class GeminiProvider extends BaseAIProvider {
  static readonly defaultModel = 'gemini-1.5-pro';

  constructor(apiKey: string, defaultModel?: string) {
    super(apiKey, defaultModel || GeminiProvider.defaultModel);
  }

  async enhance(input: EnhancementInput): Promise<LLMResponse> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = this.getModel(input.model) || GeminiProvider.defaultModel;

    const generativeModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json',
      },
    });

    const parts = [
      input.prompt,
      { inlineData: { data: input.base64File, mimeType: input.mimeType } },
    ];

    const result = await generativeModel.generateContent(parts);
    const response = result.response;
    const content = response.text();
    const usageMetadata = result.response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;

    return {
      content,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
    };
  }

  async listModels(apiKey: string): Promise<ModelInfo[]> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
    );
    if (!response.ok) throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    const data = await response.json();
    if (!data.models || !Array.isArray(data.models)) throw new Error('No models in API response');

    let isExhausted = false;
    try {
      const q = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      );
      if (!q.ok && q.status === 403) isExhausted = true;
    } catch {
      // ignore
    }

    return data.models
      .filter(
        (m: { supportedGenerationMethods?: string[] }) =>
          m.supportedGenerationMethods?.includes('generateContent') ||
          m.supportedGenerationMethods?.includes('generateText')
      )
      .map((m: { name: string; displayName?: string }) => {
        const id = m.name.replace('models/', '');
        const isFree = id.includes('flash') || id.includes('1.5-flash');
        return {
          id,
          name: m.displayName || id,
          isFree,
          status: isExhausted ? ('exhausted' as const) : (isFree ? ('free' as const) : ('paid' as const)),
        };
      })
      .sort((a: ModelInfo, b: ModelInfo) => a.name.localeCompare(b.name));
  }
}
