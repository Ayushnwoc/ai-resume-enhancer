'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { Card } from '@/components/elements/card';
import { Input } from '@/components/elements/input';
import { Label } from '@/components/elements/label';
import { Button } from '@/components/elements/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/elements/select';
import { getApiKeys, saveApiKeys, getSavedSettings, saveSettings } from '@/lib/storage';
import type { LLMProvider } from '@/types';

interface Model {
  id: string;
  name: string;
  status?: 'free' | 'paid' | 'exhausted' | 'unknown';
  isFree?: boolean;
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: { provider: LLMProvider; apiKey: string; model: string }) => void;
  initialProvider?: LLMProvider;
  initialApiKey?: string;
  initialModel?: string;
  providerApiKeys?: Record<LLMProvider, string>;
}

export function SettingsModal({
  open,
  onClose,
  onSave,
  initialProvider = 'openai',
  initialApiKey = '',
  initialModel = '',
  providerApiKeys = {} as Record<LLMProvider, string>,
}: SettingsModalProps) {
  const [provider, setProvider] = useState<LLMProvider>(initialProvider);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [model, setModel] = useState(initialModel);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setProvider(initialProvider);
      // Always load the API key for the selected provider from saved keys first
      const apiKeys = getApiKeys();
      // Prioritize saved keys from localStorage, then fallback to props
      const keyForProvider = apiKeys[initialProvider] || providerApiKeys[initialProvider] || initialApiKey;
      setApiKey(keyForProvider);
      
      // Load saved model for the current provider, or use initialModel
      const savedSettings = getSavedSettings();
      const savedModel = savedSettings && savedSettings.provider === initialProvider 
        ? savedSettings.model 
        : initialModel;
      setModel(savedModel || initialModel);
      
      // Clear errors when modal opens
      setModelError(null);
      // Don't clear models here - let the apiKey useEffect handle fetching
      // This ensures models are fetched when modal opens with an API key
    } else {
      // Only clear models when modal closes
      setModels([]);
      setModelError(null);
    }
  }, [open, initialProvider, initialApiKey, initialModel, providerApiKeys]);

  // When provider changes, automatically load the API key and saved model for that provider
  useEffect(() => {
    if (open) {
      const apiKeys = getApiKeys();
      // Always prioritize saved API keys from localStorage
      if (apiKeys[provider]) {
        setApiKey(apiKeys[provider]);
      } else if (providerApiKeys[provider]) {
        // Fallback to props if localStorage doesn't have it
        setApiKey(providerApiKeys[provider]);
      } else {
        // Clear if no saved key exists
        setApiKey('');
      }
      
      // Load saved model for the new provider, or clear if none exists
      const savedSettings = getSavedSettings();
      if (savedSettings && savedSettings.provider === provider && savedSettings.model) {
        setModel(savedSettings.model);
      } else {
        setModel(''); // Reset model when switching providers if no saved model
      }
      
      setModels([]); // Clear models list when switching providers
      setModelError(null); // Clear any errors
    }
  }, [provider, providerApiKeys, open]);

  useEffect(() => {
    // Only fetch if modal is open
    if (!open) return;
    
    if (apiKey.trim() && apiKey.length > 10) {
      // Fetch models when API key is available
      // Use a small delay to ensure state is settled
      const timeoutId = setTimeout(() => {
        fetchModels();
      }, 100);
      return () => clearTimeout(timeoutId);
    } else {
      // Clear fetched models if no API key, but keep default models available
      setModels([]);
      setModelError(null);
    }
  }, [apiKey, provider, open]);

  const fetchModels = async () => {
    // Don't fetch if modal is not open
    if (!open) return;
    
    setLoadingModels(true);
    setModelError(null);
    
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, apiKey }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch models');
      }

      const data = await response.json();
      // Only update models if modal is still open
      if (open) {
        setModels(data.models || []);
        
        // Only auto-select first model if no model is currently selected
        // But don't override if there's already a saved model
        if (data.models && data.models.length > 0) {
          const savedSettings = getSavedSettings();
          const hasSavedModel = savedSettings && savedSettings.provider === provider && savedSettings.model;
          
          if (!model && !hasSavedModel) {
            // No current model and no saved model, auto-select first
            setModel(data.models[0].id);
          } else if (hasSavedModel && savedSettings.model) {
            // Check if saved model exists in the fetched models
            const modelExists = data.models.some((m: Model) => m.id === savedSettings.model);
            if (modelExists) {
              setModel(savedSettings.model);
            } else if (!model) {
              // Saved model doesn't exist, use first available
              setModel(data.models[0].id);
            }
          }
        }
      }
    } catch (error) {
      if (open) {
        setModelError(error instanceof Error ? error.message : 'Failed to fetch models');
        setModels([]);
      }
    } finally {
      if (open) {
        setLoadingModels(false);
      }
    }
  };

  const getDefaultModels = (): Model[] => {
    switch (provider) {
      case 'openai':
        return [
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        ];
      case 'anthropic':
        return [
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
        ];
      case 'gemini':
        return [
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
          { id: 'gemini-pro', name: 'Gemini Pro' },
        ];
      case 'grok':
        return [
          { id: 'grok-beta', name: 'Grok Beta', isFree: true },
          { id: 'grok-2', name: 'Grok 2', isFree: false },
        ];
      default:
        return [];
    }
  };

  const availableModels = models.length > 0 ? models : getDefaultModels();

  const handleSave = () => {
    if (!apiKey.trim()) {
      return;
    }
    const selectedModel = model.trim() || (availableModels.length > 0 ? availableModels[0].id : '');
    if (!selectedModel) {
      return;
    }
    
    // Save API key to separate storage
    const apiKeys = getApiKeys();
    apiKeys[provider] = apiKey;
    saveApiKeys(apiKeys);
    
    // Save settings
    saveSettings(provider, selectedModel);
    
    onSave({ provider, apiKey, model: selectedModel });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md p-6 bg-background" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between ">
          <h2 className="text-xl font-semibold">API Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="provider" className="text-sm font-medium">
              Provider
            </Label>
            <Select 
              value={provider} 
              onValueChange={(value) => {
                const newProvider = value as LLMProvider;
                setProvider(newProvider);
                // Immediately load the saved API key for the new provider
                const apiKeys = getApiKeys();
                if (apiKeys[newProvider]) {
                  setApiKey(apiKeys[newProvider]);
                } else {
                  setApiKey('');
                }
                
                // Load saved model for the new provider
                const savedSettings = getSavedSettings();
                if (savedSettings && savedSettings.provider === newProvider && savedSettings.model) {
                  setModel(savedSettings.model);
                } else {
                  setModel('');
                }
                
                setModels([]);
                setModelError(null);
              }}
            >
              <SelectTrigger id="provider" className="mt-2">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="grok">Grok (xAI)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="api-key" className="text-sm font-medium">
              API Key
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="api-key"
                type="password"
                placeholder={
                  provider === 'openai'
                    ? 'sk-...'
                    : provider === 'anthropic'
                    ? 'sk-ant-...'
                    : provider === 'grok'
                    ? 'xai-...'
                    : 'AIza...'
                }
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              {apiKey.trim().length > 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={fetchModels}
                  disabled={loadingModels}
                  title="Refresh models"
                >
                  {loadingModels ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your API key is stored locally and never sent to our servers.
            </p>
            <div className="mt-2">
              <a
                href={
                  provider === 'openai'
                    ? 'https://platform.openai.com/api-keys'
                    : provider === 'anthropic'
                    ? 'https://console.anthropic.com/settings/keys'
                    : provider === 'grok'
                    ? 'https://console.x.ai/api-keys'
                    : 'https://aistudio.google.com/apikey'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Get your API key from {provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : provider === 'grok' ? 'xAI Console' : 'Google AI Studio'}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div>
            <Label htmlFor="model" className="text-sm font-medium">
              Model
            </Label>
            {loadingModels ? (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading available models...</span>
              </div>
            ) : modelError ? (
              <div className="mt-2 p-2 bg-destructive/10 text-destructive text-xs rounded">
                {modelError}
              </div>
            ) : availableModels.length > 0 ? (
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model" className="mt-2">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <span>{m.name}</span>
                        {m.isFree && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">(Free)</span>
                        )}
                        {m.status === 'exhausted' && (
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">(Exhausted)</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">
                Enter an API key to see available models
              </div>
            )}
          </div>

          <Button onClick={handleSave} className="w-full" disabled={!apiKey.trim() || !model.trim()}>
            Save Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}


