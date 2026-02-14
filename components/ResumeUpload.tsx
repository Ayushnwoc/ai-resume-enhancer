'use client';

import { useCallback, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/elements/button';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
  ALLOWED_RESUME_MIME_TYPE,
  ALLOWED_RESUME_EXTENSION,
} from '@/lib/constants';

interface ResumeUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export function ResumeUpload({ onFileSelect, selectedFile }: ResumeUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size exceeds ${MAX_FILE_SIZE_LABEL} limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    const isValidType =
      fileType === ALLOWED_RESUME_MIME_TYPE ||
      fileName.endsWith(ALLOWED_RESUME_EXTENSION);

    if (!isValidType) {
      return 'Only PDF files are supported. Please upload a PDF file.';
    }

    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    onFileSelect(null as any);
    setError(null);
  }, [onFileSelect]);

  return (
    <div className="space-y-2">
      {selectedFile ? (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg border">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="mb-2 text-sm font-medium">
            Drop your resume here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            PDF files only (max {MAX_FILE_SIZE_LABEL})
          </p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,application/pdf"
            onChange={handleChange}
          />
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}

