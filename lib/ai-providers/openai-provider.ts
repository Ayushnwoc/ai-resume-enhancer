import OpenAI from 'openai';
import { BaseAIProvider } from './base';
import type { EnhancementInput } from './types';
import type { LLMResponse } from '@/types';

export class OpenAIProvider extends BaseAIProvider {
  static readonly defaultModel = 'gpt-4o';

  constructor(apiKey: string, defaultModel?: string) {
    super(apiKey, defaultModel || OpenAIProvider.defaultModel);
  }

  async enhance(input: EnhancementInput): Promise<LLMResponse> {
    const openai = new OpenAI({ apiKey: this.apiKey });
    const model = this.getModel(input.model) || OpenAIProvider.defaultModel;
    const isVisionModel =
      model.includes('gpt-4o') || model.includes('gpt-4-turbo') || model.includes('vision');

    const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
      { type: 'text', text: input.prompt },
      {
        type: 'image_url',
        image_url: { url: `data:${input.mimeType};base64,${input.base64File}` },
      },
    ];

    const response = await openai.chat.completions.create({
      model: isVisionModel ? model : 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that returns JSON responses only. Analyze the provided resume PDF file and return the analysis in the requested JSON format. Make sure to return valid JSON with both "score" and "suggestions" fields.',
        },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content ?? '';
    const usage = response.usage;

    return {
      content,
      tokens: {
        input: usage?.prompt_tokens ?? 0,
        output: usage?.completion_tokens ?? 0,
        total: usage?.total_tokens ?? 0,
      },
    };
  }

  async listModels(apiKey: string): Promise<import('./types').ModelInfo[]> {
    const openai = new OpenAI({ apiKey });
    const response = await openai.models.list();
    return response.data
      .filter(
        (m) => m.id.includes('gpt') && !m.id.includes('instruct') && !m.id.includes('vision')
      )
      .map((m) => ({
        id: m.id,
        name: m.id,
        isFree: m.id.includes('gpt-4o-mini') || m.id.includes('gpt-3.5-turbo'),
        status: 'unknown' as const,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
