'use client';

import { Textarea } from '@/components/elements/textarea';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobDescriptionInput({ value, onChange }: JobDescriptionInputProps) {
  const characterCount = value.length;

  return (
    <div className="space-y-2">
      <Textarea
        id="job-description"
        placeholder="Paste the job description here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[300px] resize-y"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Include required skills, qualifications, and responsibilities.</span>
        <span>{characterCount.toLocaleString()} characters</span>
      </div>
    </div>
  );
}

