import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai-providers';
import type { LLMProvider } from '@/types';

const VALID_PROVIDERS: LLMProvider[] = ['openai', 'anthropic', 'gemini', 'grok'];

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    const aiProvider = getAIProvider(provider as LLMProvider, { apiKey });

    if (!aiProvider.listModels) {
      return NextResponse.json(
        { error: `Provider ${provider} does not support listing models` },
        { status: 400 }
      );
    }

    const models = await aiProvider.listModels(apiKey);
    return NextResponse.json({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    if (message.includes('401') || message.includes('Incorrect API key')) {
      return NextResponse.json(
        { error: 'Invalid or exhausted API key. Please check your API key.' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: `Failed to fetch models: ${message}` },
      { status: 500 }
    );
  }
}
