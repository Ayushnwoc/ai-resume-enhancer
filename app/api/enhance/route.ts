import { NextRequest, NextResponse } from 'next/server';
import { enhanceResumeChunks } from '@/lib/chunk-enhancer';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_JOB_DESCRIPTION_LENGTH,
  ALLOWED_RESUME_MIME_TYPE,
  ALLOWED_RESUME_EXTENSION,
} from '@/lib/constants';
import type { EnhancementResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jobDescription = formData.get('jobDescription') as string;
    const apiKey = formData.get('apiKey') as string;
    const provider = formData.get('provider') as 'openai' | 'anthropic' | 'gemini' | 'grok';
    const model = formData.get('model') as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        {
          error: `Job description exceeds ${MAX_JOB_DESCRIPTION_LENGTH.toLocaleString()} character limit. Current length: ${jobDescription.length.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!provider || !['openai', 'anthropic', 'gemini', 'grok'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "openai", "anthropic", "gemini", or "grok"' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    // Validate file type - only PDFs allowed
    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    if (!fileName.endsWith(ALLOWED_RESUME_EXTENSION) && fileType !== ALLOWED_RESUME_MIME_TYPE) {
      return NextResponse.json(
        {
          error: 'Only PDF files are supported. Please upload a PDF file.',
        },
        { status: 400 }
      );
    }

    // Convert file to base64 for sending to AI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64File = buffer.toString('base64');
    const mimeType = ALLOWED_RESUME_MIME_TYPE;

    // Use chunk-based enhancement - send file directly to AI
    let enhancementResult;
    try {
      enhancementResult = await enhanceResumeChunks(
        file,
        base64File,
        mimeType,
        jobDescription,
        {
          provider,
          apiKey,
          model: model || undefined,
        }
      );
    } catch (error) {
      console.error('Enhancement error:', error);
      throw error;
    }

    // Prepare result - we're just providing suggestions, not modifying text
    const result: EnhancementResult = {
      enhancedText: '', // Not needed since we're not modifying text
      diff: { chunks: [], addedCount: 0, removedCount: 0 }, // No diff needed
      score: enhancementResult.score,
      tokens: enhancementResult.tokens,
      format: 'pdf',
      modifications: enhancementResult.modifications || [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Enhancement error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

