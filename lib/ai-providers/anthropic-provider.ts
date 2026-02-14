import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base';
import type { EnhancementInput, ModelInfo } from './types';
import type { LLMResponse } from '@/types';

export class AnthropicProvider extends BaseAIProvider {
  static readonly defaultModel = 'claude-3-5-sonnet-20241022';

  constructor(apiKey: string, defaultModel?: string) {
    super(apiKey, defaultModel || AnthropicProvider.defaultModel);
  }

  async enhance(input: EnhancementInput): Promise<LLMResponse> {
    const anthropic = new Anthropic({ apiKey: this.apiKey });
    const model = this.getModel(input.model) || AnthropicProvider.defaultModel;

    const userContent: Anthropic.MessageParam['content'] = [
      { type: 'text', text: input.prompt },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: input.mimeType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
          data: input.base64File,
        },
      },
    ];

    const response = await anthropic.messages.create({
      model,
      max_tokens: 4000,
      messages: [{ role: 'user', content: userContent }],
    });

    const content =
      response.content[0]?.type === 'text' ? response.content[0].text : '';
    const usage = response.usage;

    return {
      content,
      tokens: {
        input: usage.input_tokens,
        output: usage.output_tokens,
        total: usage.input_tokens + usage.output_tokens,
      },
    };
  }

  async listModels(_apiKey: string): Promise<ModelInfo[]> {
    let isExhausted = false;
    try {
      const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      if (!testResponse.ok && (testResponse.status === 401 || testResponse.status === 403)) {
        isExhausted = true;
      }
    } catch {
      // ignore
    }
    return [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', isFree: false, status: isExhausted ? 'exhausted' : 'paid' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', isFree: false, status: isExhausted ? 'exhausted' : 'paid' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', isFree: false, status: isExhausted ? 'exhausted' : 'paid' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', isFree: false, status: isExhausted ? 'exhausted' : 'paid' },
    ];
  }
}
