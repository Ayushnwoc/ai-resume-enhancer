'use client';

import { Textarea } from '@/components/elements/textarea';
import { MAX_JOB_DESCRIPTION_LENGTH } from '@/lib/constants';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobDescriptionInput({ value, onChange }: JobDescriptionInputProps) {
  const characterCount = value.length;
  const atLimit = characterCount >= MAX_JOB_DESCRIPTION_LENGTH;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    if (next.length <= MAX_JOB_DESCRIPTION_LENGTH) {
      onChange(next);
    } else {
      onChange(next.slice(0, MAX_JOB_DESCRIPTION_LENGTH));
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        id="job-description"
        placeholder="Paste the job description here..."
        value={value}
        onChange={handleChange}
        maxLength={MAX_JOB_DESCRIPTION_LENGTH}
        className="min-h-[300px] resize-y"
        aria-describedby="job-desc-hint job-desc-count"
      />
      <div
        id="job-desc-hint"
        className="flex items-center justify-between text-xs text-muted-foreground"
      >
        <span>Include required skills, qualifications, and responsibilities.</span>
        <span
          id="job-desc-count"
          className={atLimit ? 'font-medium text-amber-600 dark:text-amber-400' : undefined}
        >
          {characterCount.toLocaleString()} / {MAX_JOB_DESCRIPTION_LENGTH.toLocaleString()} characters
        </span>
      </div>
    </div>
  );
}

