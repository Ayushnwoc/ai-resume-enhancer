/**
 * Application limits – single source of truth.
 * Used for validation in API routes, client components, and error messages.
 */

/** Max resume file size in bytes (5MB). */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Max resume file size for display and error messages (e.g. "5MB"). */
export const MAX_FILE_SIZE_MB = 5;

/** Human-readable label for file size limit. */
export const MAX_FILE_SIZE_LABEL = `${MAX_FILE_SIZE_MB}MB`;

/** Max job description length in characters (50k). Prevents abuse and keeps prompts bounded. */
export const MAX_JOB_DESCRIPTION_LENGTH = 50_000;

/** Allowed MIME type for resume uploads. */
export const ALLOWED_RESUME_MIME_TYPE = 'application/pdf' as const;

/** File extension allowed for resumes. */
export const ALLOWED_RESUME_EXTENSION = '.pdf';
