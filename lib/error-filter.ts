import { MAX_FILE_SIZE_LABEL } from '@/lib/constants';

/**
 * Filters and formats error messages to show user-friendly messages
 */
export function filterErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred';
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  // API Key errors
  if (errorMessage.includes('API key') || errorMessage.includes('api key')) {
    if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
      return 'Invalid API key. Please check your API key and try again.';
    }
    if (errorMessage.includes('required')) {
      return 'API key is required. Please enter your API key in settings.';
    }
    return 'API key error. Please check your API key in settings.';
  }

  // Model errors
  if (errorMessage.includes('model') || errorMessage.includes('Model')) {
    if (errorMessage.includes('not found') || errorMessage.includes('not available')) {
      return 'Selected model is not available. Please choose a different model.';
    }
    if (errorMessage.includes('required')) {
      return 'Please select a model in settings.';
    }
    return 'Model error. Please select another model.';
  }

  // File errors
  if (errorMessage.includes('file') || errorMessage.includes('File')) {
    if (errorMessage.includes('size') || errorMessage.includes('limit')) {
      return `File size exceeds ${MAX_FILE_SIZE_LABEL} limit. Please upload a smaller file.`;
    }
    if (errorMessage.includes('type') || errorMessage.includes('format')) {
      return 'Unsupported file type. Please upload a PDF or DOCX file.';
    }
    if (errorMessage.includes('parse') || errorMessage.includes('Parse')) {
      return 'Failed to read file. Please ensure the file is not corrupted.';
    }
    return 'File upload error. Please try again.';
  }

  // Network errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Network')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Rate limit errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
    return 'Rate limit exceeded. Please wait a moment and try again.';
  }

  // Authentication errors
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('authentication')) {
    return 'Authentication failed. Please check your API key.';
  }

  // Server errors
  if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
    return 'Server error. Please try again later.';
  }

  // Provider-specific errors
  if (errorMessage.includes('OpenAI')) {
    if (errorMessage.includes('404')) {
      return 'OpenAI model not found. Please select a different model.';
    }
    return 'OpenAI API error. Please check your API key and model selection.';
  }

  if (errorMessage.includes('Anthropic') || errorMessage.includes('Claude')) {
    if (errorMessage.includes('404')) {
      return 'Anthropic model not found. Please select a different model.';
    }
    return 'Anthropic API error. Please check your API key and model selection.';
  }

  if (errorMessage.includes('Gemini') || errorMessage.includes('Google')) {
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return 'Gemini model not found. Please select a different model.';
    }
    return 'Gemini API error. Please check your API key and model selection.';
  }

  // Job description errors
  if (errorMessage.includes('job description') || errorMessage.includes('Job description')) {
    if (errorMessage.includes('exceeds') || errorMessage.includes('character limit')) {
      return 'Job description is too long. Please shorten it to 50,000 characters or less.';
    }
    return 'Please enter a job description.';
  }

  // Resume errors
  if (errorMessage.includes('resume') || errorMessage.includes('Resume')) {
    if (errorMessage.includes('upload') || errorMessage.includes('Upload')) {
      return 'Please upload a resume file.';
    }
  }

  // Generic fallback - show first 100 characters if it's a reasonable message
  if (errorMessage.length < 100) {
    return errorMessage;
  }

  // For long error messages, show a generic message
  return 'An error occurred. Please try again.';
}


