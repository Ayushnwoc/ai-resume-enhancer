import type { LLMProvider, LLMResponse, ModificationChunk, MatchingScore } from '@/types';
import { getAIProvider } from '@/lib/ai-providers';
import type { IAIProvider } from '@/lib/ai-providers';

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
 * Enhanced resume using chunk-based approach.
 * Uses multi-provider system (Open/Closed): pass config to use a built-in provider,
 * or pass an optional IAIProvider to use a custom provider directly.
 */
export async function enhanceResumeChunks(
  file: File,
  base64File: string,
  mimeType: string,
  jobDescription: string,
  config: LLMConfig,
  aiProvider?: IAIProvider
): Promise<ChunkEnhancementResult> {
  const prompt = createChunkEnhancementPrompt(jobDescription);
  const provider =
    aiProvider ??
    getAIProvider(config.provider, {
      apiKey: config.apiKey,
      model: config.model,
    });

  const llmResponse = await provider.enhance({
    file,
    base64File,
    mimeType,
    prompt,
    model: config.model,
  });

  const { modifications, score } = parseAIResponse(llmResponse.content);

  return {
    enhancedText: '',
    modifications,
    score,
    tokens: llmResponse.tokens,
  };
}

function createChunkEnhancementPrompt(
  jobDescription: string
): string {
  return `You are an industry-level ATS (Applicant Tracking System) resume analyst. Your role is to evaluate the attached resume PDF exactly as an enterprise ATS would: keyword matching, skill alignment, experience relevance, and fit for the specific job. Your goal is to give ALL possible suggestions that will make this resume perfect for the job description and ensure it will pass ATS screening. Be thorough: identify every gap, missing keyword, irrelevant item, and improvement so the candidate can act on them and maximize their chance of passing ATS. You must give targeted suggestions that clearly state what to ADD (and why it matters for this job) and what to REMOVE or de-emphasize (and why it does not fit or is irrelevant to this job description).

CRITICAL JSON FORMAT REQUIREMENTS:
- You MUST return ONLY valid JSON. No text before or after the JSON, no markdown code blocks, no trailing commas.
- All strings must be properly escaped (use \\" for quotes inside strings). All numbers 0-100.
- Every suggestion MUST have "type" equal to either "add" or "remove".

EVALUATION (ATS-STYLE):
1. keywordMatching (0-100): Presence and prominence of job-description keywords and phrases (titles, tools, methodologies, certifications). Missing or weak keyword usage hurts ATS ranking.
2. skillAlignment (0-100): How well listed skills map to required and preferred skills in the job description. Irrelevant or outdated skills dilute the resume.
3. experienceRelevance (0-100): Relevance of roles, responsibilities, and achievements to the target role. Generic or off-target experience reduces fit.
4. overallFit (0-100): Holistic match to role level, industry, and responsibilities.
5. total (0-100): Weighted score: keywordMatching*0.4 + skillAlignment*0.3 + experienceRelevance*0.2 + overallFit*0.1
6. explanation: One or two sentences summarizing why the resume scores this way and what would move the needle most (escape quotes).

SUGGESTIONS (ADD vs REMOVE):
- For each suggestion you MUST set "type" to "add" or "remove".
- type "add": Something the candidate should add to the resume. "suggestion" = the exact or paraphrased content to add (or a clear instruction, e.g. "Add a bullet: Led migration of legacy APIs to microservices"). "reason" = WHY adding this helps for THIS job (cite job description: e.g. "Job requires microservices experience; this makes the match explicit for ATS and recruiters.").
- type "remove": Something that should be removed, shortened, or de-emphasized. "suggestion" = the specific phrase, bullet, or item to remove or reduce (quote or paraphrase from the resume). "reason" = WHY it should be removed or does not make sense for THIS job (e.g. "Job does not mention X; this adds noise and dilutes focus on Y which is required." or "Outdated technology not in JD; reduces relevance.").

Cover every relevant section (Summary, Experience, Skills, Education, Certifications, etc.). Give ALL suggestions that will make the resume pass ATS and fit the job—do not hold back. Include as many actionable items as needed (typically 6–15 or more if the resume has many gaps). Use a strong mix of "add" and "remove". Be specific and cite the job description in every reason. The aim is a resume that would pass automated screening and impress recruiters.

EXACT JSON FORMAT (replace values, keep structure; include both add and remove examples):
{
  "score": {
    "total": 72,
    "breakdown": {
      "keywordMatching": 75,
      "skillAlignment": 70,
      "experienceRelevance": 72,
      "overallFit": 70
    },
    "explanation": "Solid experience but several required keywords are missing; a few bullets are off-target for this role."
  },
  "suggestions": [
    {
      "type": "add",
      "section": "Skills",
      "suggestion": "Add Kubernetes and Terraform to the technical skills list",
      "reason": "Job description explicitly requires experience with container orchestration and IaC; adding these improves ATS keyword match and recruiter scan."
    },
    {
      "type": "remove",
      "section": "Experience",
      "suggestion": "Remove or shorten the bullet about maintaining legacy VB6 applications",
      "reason": "Role focuses on cloud-native and modern stack; legacy VB6 is not mentioned in the JD and can make the profile look less aligned. Prioritize cloud and API work instead."
    },
    {
      "type": "add",
      "section": "Experience",
      "suggestion": "Add a bullet under your current role: Designed and deployed REST APIs serving 1M+ requests/day",
      "reason": "Job asks for high-scale API design; this quantifies relevant experience and matches required keywords."
    }
  ]
}

JOB DESCRIPTION:
${jobDescription}

Return ONLY the JSON object. Validate JSON: no trailing commas, escaped quotes, and every suggestion has "type": "add" or "type": "remove".`;
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
    
    // Parse suggestions (support type: "add" | "remove" with reason)
    let modifications: ModificationChunk[] = [];
    if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      modifications = parsed.suggestions
        .filter((sug: any) => sug.suggestion)
        .map((sug: any) => {
          const type = String(sug.type || 'add').toLowerCase() === 'remove' ? 'remove' : 'add';
          const text = String(sug.suggestion || '').trim();
          const reason = sug.reason ? String(sug.reason).trim() : '';
          const section = sug.section ? String(sug.section).trim() : '';
          return type === 'remove'
            ? { original: text, modified: '', reason, section, suggestionType: 'remove' as const }
            : { original: '', modified: text, reason, section, suggestionType: 'add' as const };
        });
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
          type: 'add',
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
        
        const modifications: ModificationChunk[] = (extracted.suggestions || []).map((sug: any) => {
          const type = String(sug.type || 'add').toLowerCase() === 'remove' ? 'remove' : 'add';
          const text = String(sug.suggestion || '').trim();
          const reason = String(sug.reason || '').trim();
          const section = String(sug.section || '').trim();
          return type === 'remove'
            ? { original: text, modified: '', reason, section, suggestionType: 'remove' as const }
            : { original: '', modified: text, reason, section, suggestionType: 'add' as const };
        });
        
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

