import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    let models: Array<{ id: string; name: string; status?: 'free' | 'paid' | 'exhausted' | 'unknown'; isFree?: boolean }> = [];

    switch (provider) {
      case 'gemini': {
        try {
          // Use the REST API directly to list models
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
          );
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.models && Array.isArray(data.models)) {
            // Check if API key is exhausted by checking quota
            let isExhausted = false;
            try {
              const quotaResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
              );
              if (!quotaResponse.ok && quotaResponse.status === 403) {
                isExhausted = true;
              }
            } catch (quotaError) {
              // Ignore quota check errors
            }
            
            models = data.models
              .filter((model: any) => 
                model.supportedGenerationMethods?.includes('generateContent') ||
                model.supportedGenerationMethods?.includes('generateText')
              )
              .map((model: any) => {
                const modelId = model.name.replace('models/', '');
                const isFree = modelId.includes('flash') || modelId.includes('1.5-flash');
                return {
                  id: modelId,
                  name: model.displayName || modelId,
                  isFree,
                  status: isExhausted ? 'exhausted' : (isFree ? 'free' : 'paid'),
                };
              })
              .sort((a: any, b: any) => a.name.localeCompare(b.name));
          } else {
            throw new Error('No models found in API response');
          }
        } catch (error) {
          return NextResponse.json(
            { error: `Failed to fetch Gemini models: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
          );
        }
        break;
      }

      case 'openai': {
        try {
          const openai = new OpenAI({ apiKey });
          const response = await openai.models.list();
          
          models = response.data
            .filter(model => 
              model.id.includes('gpt') && 
              !model.id.includes('instruct') &&
              !model.id.includes('vision')
            )
            .map(model => {
              const isFree = model.id.includes('gpt-4o-mini') || model.id.includes('gpt-3.5-turbo');
              return {
                id: model.id,
                name: model.id,
                isFree,
                status: 'unknown' as const,
              };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
          // Check if error is due to invalid/exhausted API key
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (errorMessage.includes('401') || errorMessage.includes('Incorrect API key')) {
            return NextResponse.json(
              { error: `Invalid or exhausted API key. Please check your OpenAI API key.` },
              { status: 401 }
            );
          }
          return NextResponse.json(
            { error: `Failed to fetch OpenAI models: ${errorMessage}` },
            { status: 500 }
          );
        }
        break;
      }

      case 'anthropic': {
        // Anthropic has a limited set of models, return them directly
        // Check if API key is valid by making a test request
        let isExhausted = false;
        try {
          const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'test' }],
            }),
          });
          
          if (!testResponse.ok) {
            const errorData = await testResponse.json().catch(() => ({}));
            if (testResponse.status === 401 || testResponse.status === 403) {
              isExhausted = true;
            }
          }
        } catch (testError) {
          // Ignore test errors
        }
        
        models = [
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', isFree: false, status: isExhausted ? 'exhausted' : 'paid' },
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', isFree: false, status: isExhausted ? 'exhausted' : 'paid' },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', isFree: false, status: isExhausted ? 'exhausted' : 'paid' },
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', isFree: false, status: isExhausted ? 'exhausted' : 'paid' },
        ];
        break;
      }

      case 'grok': {
        // Grok models - check API key validity
        let isExhausted = false;
        try {
          const testResponse = await fetch('https://api.x.ai/v1/models', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!testResponse.ok) {
            if (testResponse.status === 401 || testResponse.status === 403) {
              isExhausted = true;
            }
          } else {
            const data = await testResponse.json();
            if (data.data && Array.isArray(data.data)) {
              models = data.data.map((model: any) => ({
                id: model.id,
                name: model.id,
                isFree: model.id.includes('beta') || model.id.includes('free'),
                status: isExhausted ? 'exhausted' : (model.id.includes('beta') ? 'free' : 'paid'),
              }));
              break;
            }
          }
        } catch (testError) {
          // If API call fails, use default models
        }
        
        // Default Grok models if API call fails
        models = [
          { id: 'grok-beta', name: 'Grok Beta', isFree: true, status: isExhausted ? 'exhausted' : 'free' },
          { id: 'grok-2', name: 'Grok 2', isFree: false, status: isExhausted ? 'exhausted' : 'paid' },
        ];
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported provider: ${provider}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

