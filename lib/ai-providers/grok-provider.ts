import { BaseAIProvider } from './base';
import type { EnhancementInput, ModelInfo } from './types';
import type { LLMResponse } from '@/types';

export class GrokProvider extends BaseAIProvider {
  static readonly defaultModel = 'grok-beta';

  constructor(apiKey: string, defaultModel?: string) {
    super(apiKey, defaultModel || GrokProvider.defaultModel);
  }

  async enhance(input: EnhancementInput): Promise<LLMResponse> {
    const model = this.getModel(input.model) || GrokProvider.defaultModel;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: input.prompt },
              {
                type: 'image_url',
                image_url: { url: `data:${input.mimeType};base64,${input.base64File}` },
              },
            ],
          },
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ?? `Grok API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content ?? '';
    const inputTokens =
      data.usage?.prompt_tokens ??
      Math.ceil((input.prompt.length + input.base64File.length * 0.75) / 4);
    const outputTokens = data.usage?.completion_tokens ?? Math.ceil(content.length / 4);

    return {
      content,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: data.usage?.total_tokens ?? inputTokens + outputTokens,
      },
    };
  }

  async listModels(apiKey: string): Promise<ModelInfo[]> {
    let isExhausted = false;
    try {
      const res = await fetch('https://api.x.ai/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok && (res.status === 401 || res.status === 403)) isExhausted = true;
      else {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((m: { id: string }) => ({
            id: m.id,
            name: m.id,
            isFree: m.id.includes('beta') || m.id.includes('free'),
            status: (isExhausted ? 'exhausted' : m.id.includes('beta') ? 'free' : 'paid') as ModelInfo['status'],
          }));
        }
      }
    } catch {
      // use defaults
    }
    return [
      { id: 'grok-beta', name: 'Grok Beta', isFree: true, status: isExhausted ? 'exhausted' : 'free' },
      { id: 'grok-2', name: 'Grok 2', isFree: false, status: isExhausted ? 'exhausted' : 'paid' },
    ];
  }
}
