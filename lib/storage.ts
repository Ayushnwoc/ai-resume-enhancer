import type { LLMProvider } from '@/types';

/**
 * Storage utility functions for managing API keys and settings
 */

export function getApiKeys(): Record<LLMProvider, string> {
  try {
    const stored = localStorage.getItem('resume-enhancer-api-keys');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    // Ignore parse errors
  }
  return {} as Record<LLMProvider, string>;
}

export function saveApiKeys(apiKeys: Record<LLMProvider, string>): void {
  localStorage.setItem('resume-enhancer-api-keys', JSON.stringify(apiKeys));
}

export function getSavedSettings(): { provider?: LLMProvider; model?: string } | null {
  try {
    const stored = localStorage.getItem('resume-enhancer-settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    // Ignore parse errors
  }
  return null;
}

export function saveSettings(provider: LLMProvider, model: string): void {
  localStorage.setItem('resume-enhancer-settings', JSON.stringify({ provider, model }));
}

/**
 * History storage functions
 */
export interface HistoryEntry {
  id: string;
  timestamp: string;
  filename: string;
  score: number;
  inputTokens: number;
  outputTokens: number;
  provider: string;
  model: string;
}

export interface HistoryData {
  overallInputTokens: number;
  overallOutputTokens: number;
  entries: HistoryEntry[];
}

export function getHistory(): HistoryData {
  try {
    const stored = localStorage.getItem('resume-enhancer-history');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
  return {
    overallInputTokens: 0,
    overallOutputTokens: 0,
    entries: [],
  };
}

export function saveHistory(history: HistoryData): void {
  try {
    localStorage.setItem('resume-enhancer-history', JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

export function clearHistory(): void {
  localStorage.removeItem('resume-enhancer-history');
}

