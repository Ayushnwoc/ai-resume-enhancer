import type { LLMProvider, LLMResponse, ModificationChunk, MatchingScore } from '@/types';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
}

export interface ChunkEnhancementResult {
  enhancedText: string;
  modifications: ModificationChunk[];
  score: MatchingScore;
  tokens: { input: number; output: number; total: number };
}

/**
 * Enhanced resume using chunk-based approach
 * AI returns only the modifications needed, we apply them to the original
 * File is sent directly to AI for analysis
 */
export async function enhanceResumeChunks(
  file: File,
  base64File: string,
  mimeType: string,
  jobDescription: string,
  config: LLMConfig
): Promise<ChunkEnhancementResult> {
  // Get both score and modifications from AI in a single call
  // Send file directly to AI
  const prompt = createChunkEnhancementPrompt(jobDescription);
  
  let llmResponse: LLMResponse;
  switch (config.provider) {
    case 'openai':
      llmResponse = await enhanceWithOpenAIChunks(file, base64File, mimeType, prompt, config);
      break;
    case 'anthropic':
      llmResponse = await enhanceWithAnthropicChunks(file, base64File, mimeType, prompt, config);
      break;
    case 'gemini':
      llmResponse = await enhanceWithGeminiChunks(file, base64File, mimeType, prompt, config);
      break;
    case 'grok':
      llmResponse = await enhanceWithGrokChunks(file, base64File, mimeType, prompt, config);
      break;
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }

  // Parse both score and suggestions from AI response
  const { modifications, score } = parseAIResponse(llmResponse.content);

  return {
    enhancedText: '', // Not needed since we're not modifying text
    modifications,
    score,
    tokens: llmResponse.tokens,
  };
}

function createChunkEnhancementPrompt(
  jobDescription: string
): string {
  return `You are a professional resume enhancement expert. Analyze the resume PDF file (which will be provided as an attachment) against the job description and provide a comprehensive analysis.

CRITICAL JSON FORMAT REQUIREMENTS:
- You MUST return ONLY valid JSON
- No text before or after the JSON
- No markdown code blocks
- No trailing commas
- All strings must be properly escaped
- All numbers must be valid numbers (0-100)
- The JSON must be complete and well-formed

YOUR TASK:
1. Read and analyze the resume PDF file attached
2. Calculate a matching score (0-100) with detailed breakdown:
   - keywordMatching (0-100): How well the resume matches keywords from the job description
   - skillAlignment (0-100): How well the skills match the job requirements
   - experienceRelevance (0-100): How relevant the experience is to the job
   - overallFit (0-100): Overall assessment of fit
   - total (0-100): Weighted total score (calculate as: keywordMatching*0.4 + skillAlignment*0.3 + experienceRelevance*0.2 + overallFit*0.1)
   - explanation: A brief explanation of the score (keep it concise, escape quotes properly)

3. Provide specific, actionable suggestions for improving the resume. Each suggestion must have:
   - section: The resume section name (e.g., "Experience", "Skills", "Summary")
   - suggestion: A specific action item - what to add or change (escape quotes properly)
   - reason: Why this helps match the job description (escape quotes properly)

EXACT JSON FORMAT (copy this structure exactly, replace values):
{
  "score": {
    "total": 75,
    "breakdown": {
      "keywordMatching": 80,
      "skillAlignment": 70,
      "experienceRelevance": 75,
      "overallFit": 70
    },
    "explanation": "Brief explanation of the matching score"
  },
  "suggestions": [
    {
      "section": "Experience",
      "suggestion": "Add a bullet point highlighting experience with React and TypeScript",
      "reason": "The job description emphasizes React and TypeScript skills"
    }
  ]
}

Job Description:
${jobDescription}

REMEMBER: Return ONLY the JSON object above. Validate your JSON before returning. Ensure all quotes are escaped, no trailing commas, and the structure matches exactly.`;
}

async function enhanceWithOpenAIChunks(
  file: File,
  base64File: string,
  mimeType: string,
  prompt: string,
  config: LLMConfig
): Promise<LLMResponse> {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: config.apiKey,
  });

  // Use gpt-4o or gpt-4-turbo for PDF support, fallback to gpt-4o-mini
  const model = config.model || 'gpt-4o';
  const isVisionModel = model.includes('gpt-4o') || model.includes('gpt-4-turbo') || model.includes('vision');

  try {
    let userContent: any;
    
    if (isVisionModel && mimeType.includes('pdf')) {
      // For vision models, send PDF as image_url (OpenAI can process PDFs this way)
      userContent = [
        {
          type: 'text',
          text: prompt,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64File}`,
          },
        },
      ];
    } else {
      // Fallback: use vision-capable model for PDFs
      userContent = [
        {
          type: 'text',
          text: prompt,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64File}`,
          },
        },
      ];
    }

    const response = await openai.chat.completions.create({
      model: isVisionModel ? model : 'gpt-4o', // Default to gpt-4o for PDF support
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that returns JSON responses only. Analyze the provided resume PDF file and return the analysis in the requested JSON format. Make sure to return valid JSON with both "score" and "suggestions" fields.',
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '';
    const usage = response.usage;

    // Log the response for debugging
    console.log('OpenAI Response:', content.substring(0, 500));

    return {
      content,
      tokens: {
        input: usage?.prompt_tokens || 0,
        output: usage?.completion_tokens || 0,
        total: usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}

async function enhanceWithAnthropicChunks(
  file: File,
  base64File: string,
  mimeType: string,
  prompt: string,
  config: LLMConfig
): Promise<LLMResponse> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({
    apiKey: config.apiKey,
  });

  const model = config.model || 'claude-3-5-sonnet-20241022';

  try {
    // Anthropic supports PDF attachments directly
    const userContent: any[] = [
      {
        type: 'text',
        text: prompt,
      },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType,
          data: base64File,
        },
      },
    ];

    const response = await anthropic.messages.create({
      model,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const usage = response.usage;

    // Log the response for debugging
    console.log('Anthropic Response:', content.substring(0, 500));

    return {
      content,
      tokens: {
        input: usage.input_tokens,
        output: usage.output_tokens,
        total: usage.input_tokens + usage.output_tokens,
      },
    };
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Anthropic API error: ${error.message}`);
    }
    throw error;
  }
}

async function enhanceWithGeminiChunks(
  file: File,
  base64File: string,
  mimeType: string,
  prompt: string,
  config: LLMConfig
): Promise<LLMResponse> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const model = config.model || 'gemini-1.5-pro';

  try {
    const generativeModel = genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json',
      },
    });

    // Gemini supports PDFs as inline data
    const parts: any[] = [
      prompt,
      {
        inlineData: {
          data: base64File,
          mimeType: mimeType,
        },
      },
    ];

    const result = await generativeModel.generateContent(parts);
    const response = result.response;
    const content = response.text();

    const usageMetadata = result.response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;

    // Log the response for debugging
    console.log('Gemini Response:', content.substring(0, 500));

    return {
      content,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
    };
  } catch (error: any) {
    if (error?.message) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
    throw error;
  }
}

async function enhanceWithGrokChunks(
  file: File,
  base64File: string,
  mimeType: string,
  prompt: string,
  config: LLMConfig
): Promise<LLMResponse> {
  try {
    const model = config.model || 'grok-beta';
    
    // Grok API endpoint
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64File}`,
                },
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
        errorData.error?.message || `Grok API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Estimate tokens (Grok uses similar tokenization to OpenAI)
    const inputTokens = Math.ceil((prompt.length + base64File.length * 0.75) / 4);
    const outputTokens = data.usage?.completion_tokens || Math.ceil(content.length / 4);

    return {
      content,
      tokens: {
        input: data.usage?.prompt_tokens || inputTokens,
        output: data.usage?.completion_tokens || outputTokens,
        total: data.usage?.total_tokens || inputTokens + outputTokens,
      },
    };
  } catch (error: any) {
    if (error?.message) {
      throw new Error(`Grok API error: ${error.message}`);
    }
    throw error;
  }
}

function parseAIResponse(aiResponse: string): { modifications: ModificationChunk[]; score: MatchingScore } {
  // Extract JSON string first so it's available in catch block
  let jsonStr = aiResponse.trim();
  
  try {
    // Log the original JSON string for debugging
    console.log('Original JSON string (first 1000 chars):', jsonStr.substring(0, 1000));
    
    // Try parsing - if it fails, try to extract just the JSON part more carefully
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      // If parsing fails, try to extract a valid JSON structure
      console.warn('Initial parse failed, attempting to extract valid JSON...');
      
      // Try to find the score and suggestions separately and reconstruct
      const scoreMatch = jsonStr.match(/"score"\s*:\s*\{[^}]*\}/);
      const suggestionsMatch = jsonStr.match(/"suggestions"\s*:\s*\[[^\]]*\]/);
      
      if (scoreMatch || suggestionsMatch) {
        // Try to reconstruct a minimal valid JSON
        let reconstructed = '{';
        if (scoreMatch) {
          reconstructed += scoreMatch[0] + ',';
        }
        if (suggestionsMatch) {
          reconstructed += suggestionsMatch[0];
        }
        reconstructed = reconstructed.replace(/,$/, '') + '}';
        
        try {
          parsed = JSON.parse(reconstructed);
        } catch (e2) {
          // Last resort: try to manually extract values using regex
          console.warn('Reconstruction failed, attempting manual extraction...');
          throw parseError; // Re-throw original error
        }
      } else {
        throw parseError; // Re-throw if we can't extract anything
      }
    }
    
    // Parse score
    let score: MatchingScore;
    if (parsed.score) {
      score = {
        total: Number(parsed.score.total) || 0,
        breakdown: {
          keywordMatching: Number(parsed.score.breakdown?.keywordMatching) || 0,
          skillAlignment: Number(parsed.score.breakdown?.skillAlignment) || 0,
          experienceRelevance: Number(parsed.score.breakdown?.experienceRelevance) || 0,
          overallFit: Number(parsed.score.breakdown?.overallFit) || 0,
        },
        explanation: String(parsed.score.explanation || 'No explanation provided'),
      };
    } else {
      // Fallback score if AI doesn't provide it
      console.warn('No score found in AI response. Full response:', JSON.stringify(parsed, null, 2));
      score = {
        total: 0,
        breakdown: {
          keywordMatching: 0,
          skillAlignment: 0,
          experienceRelevance: 0,
          overallFit: 0,
        },
        explanation: 'Score not provided by AI',
      };
    }
    
    // Parse suggestions
    let modifications: ModificationChunk[] = [];
    if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      modifications = parsed.suggestions
        .filter((sug: any) => sug.suggestion) // Only valid suggestions
        .map((sug: any) => ({
          original: '', // Not needed for suggestions
          modified: String(sug.suggestion || '').trim(),
          reason: sug.reason ? String(sug.reason).trim() : '',
          section: sug.section ? String(sug.section).trim() : '',
        }));
    } else {
      console.warn('No suggestions found in AI response. Parsed object keys:', Object.keys(parsed));
    }
    
    return { modifications, score };
  } catch (error) {
    // If JSON parsing fails, try one more time with aggressive cleaning
    console.error('Failed to parse AI response JSON:', error);
    console.error('Full response was:', aiResponse);
    console.error('Response length:', aiResponse.length);
    
    // Last attempt: try to extract key-value pairs manually
    try {
      const extracted: any = {};
      
      // Try to extract score.total
      const totalMatch = jsonStr.match(/"total"\s*:\s*(\d+)/);
      if (totalMatch) extracted.total = parseInt(totalMatch[1]);
      
      // Try to extract breakdown values
      const keywordMatch = jsonStr.match(/"keywordMatching"\s*:\s*(\d+)/);
      const skillMatch = jsonStr.match(/"skillAlignment"\s*:\s*(\d+)/);
      const expMatch = jsonStr.match(/"experienceRelevance"\s*:\s*(\d+)/);
      const fitMatch = jsonStr.match(/"overallFit"\s*:\s*(\d+)/);
      
      if (totalMatch || keywordMatch || skillMatch || expMatch || fitMatch) {
        extracted.score = {
          total: extracted.total || 0,
          breakdown: {
            keywordMatching: keywordMatch ? parseInt(keywordMatch[1]) : 0,
            skillAlignment: skillMatch ? parseInt(skillMatch[1]) : 0,
            experienceRelevance: expMatch ? parseInt(expMatch[1]) : 0,
            overallFit: fitMatch ? parseInt(fitMatch[1]) : 0,
          },
          explanation: 'Extracted from partial JSON response',
        };
        extracted.suggestions = [];
        
        // Try to extract suggestions using regex
        const suggestionMatches = jsonStr.matchAll(/\{"section"\s*:\s*"([^"]+)",\s*"suggestion"\s*:\s*"([^"]+)",\s*"reason"\s*:\s*"([^"]+)"\}/g);
        const suggestions = Array.from(suggestionMatches).map((match: RegExpMatchArray) => ({
          section: match[1],
          suggestion: match[2],
          reason: match[3],
        }));
        
        if (suggestions.length > 0) {
          extracted.suggestions = suggestions;
        }
        
        // Use extracted data
        const score: MatchingScore = {
          total: extracted.score.total || 0,
          breakdown: {
            keywordMatching: extracted.score.breakdown.keywordMatching || 0,
            skillAlignment: extracted.score.breakdown.skillAlignment || 0,
            experienceRelevance: extracted.score.breakdown.experienceRelevance || 0,
            overallFit: extracted.score.breakdown.overallFit || 0,
          },
          explanation: extracted.score.explanation || 'Extracted from partial response',
        };
        
        const modifications: ModificationChunk[] = (extracted.suggestions || []).map((sug: any) => ({
          original: '',
          modified: String(sug.suggestion || '').trim(),
          reason: String(sug.reason || '').trim(),
          section: String(sug.section || '').trim(),
        }));
        
        console.log('Successfully extracted partial data from malformed JSON');
        return { modifications, score };
      }
    } catch (extractError) {
      console.error('Failed to extract partial data:', extractError);
    }
    
    // Return default values if all parsing attempts fail
    return {
      modifications: [],
      score: {
        total: 0,
        breakdown: {
          keywordMatching: 0,
          skillAlignment: 0,
          experienceRelevance: 0,
          overallFit: 0,
        },
        explanation: `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console logs for the raw response.`,
      },
    };
  }
}

// Removed applyModifications - we're just providing suggestions now, not modifying text

