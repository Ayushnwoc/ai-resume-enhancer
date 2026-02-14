'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Settings, History } from 'lucide-react';
import { Button } from '@/components/elements/button';
import { ResumeUpload } from '@/components/ResumeUpload';
import { JobDescriptionInput } from '@/components/JobDescriptionInput';
import { MatchingScoreDisplay } from '@/components/MatchingScore';
import { ModificationsList } from '@/components/ModificationsList';
import { SettingsModal } from '@/components/SettingsModal';
import { HistoryModal } from '@/components/HistoryModal';
import { Toaster } from '@/components/elements/toaster';
import { useToast } from '@/components/elements/use-toast';
import { filterErrorMessage } from '@/lib/error-filter';
import { MAX_JOB_DESCRIPTION_LENGTH } from '@/lib/constants';
import { getApiKeys, saveApiKeys, getSavedSettings, saveSettings, getHistory, saveHistory, type HistoryData } from '@/lib/storage';
import type { LLMProvider, EnhancementResult } from '@/types';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<LLMProvider>('openai');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnhancementResult | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { toast } = useToast();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = getSavedSettings();
    const apiKeys = getApiKeys();
    
    if (savedSettings?.provider) {
      const loadedProvider = savedSettings.provider;
      setProvider(loadedProvider);
      setModel(savedSettings.model || '');
      
      // Load API key for the provider
      if (apiKeys[loadedProvider]) {
        setApiKey(apiKeys[loadedProvider]);
      }
    }
  }, []);

  // Update API key when provider changes
  useEffect(() => {
    const apiKeys = getApiKeys();
    if (apiKeys[provider]) {
      setApiKey(apiKeys[provider]);
    } else {
      setApiKey('');
    }
  }, [provider]);

  // Save settings to localStorage
  const handleSaveSettings = (settings: { provider: LLMProvider; apiKey: string; model: string }) => {
    setProvider(settings.provider);
    setApiKey(settings.apiKey);
    setModel(settings.model);
    
    // Save provider and model
    saveSettings(settings.provider, settings.model);
    
    // Save API key to separate storage
    const apiKeys = getApiKeys();
    apiKeys[settings.provider] = settings.apiKey;
    saveApiKeys(apiKeys);
    
    toast({
      title: 'Settings saved',
      description: 'Your API settings have been saved locally.',
    });
  };

  const handleEnhance = async () => {
    if (!file) {
      toast({
        title: 'Missing Resume',
        description: 'Please upload a resume file.',
        variant: 'destructive',
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        title: 'Missing Job Description',
        description: 'Please enter a job description.',
        variant: 'destructive',
      });
      return;
    }

    if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
      toast({
        title: 'Job description too long',
        description: `Please shorten to ${MAX_JOB_DESCRIPTION_LENGTH.toLocaleString()} characters or less.`,
        variant: 'destructive',
      });
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: 'Missing API Key',
        description: 'Please configure your API key in settings.',
        variant: 'destructive',
      });
      return;
    }

    if (!model.trim()) {
      toast({
        title: 'Missing Model',
        description: 'Please select a model in settings.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobDescription', jobDescription);
      formData.append('apiKey', apiKey);
      formData.append('provider', provider);
      formData.append('model', model);

      const response = await fetch('/api/enhance', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = filterErrorMessage(errorData.error || 'Failed to enhance resume');
        throw new Error(errorMsg);
      }

      const data: EnhancementResult = await response.json();
      setResult(data);
      
      // Save to history with provider and model
      saveToHistory(file.name, data.score.total, data.tokens, provider, model);
      
      toast({
        title: 'Success',
        description: 'Resume enhanced successfully!',
      });
    } catch (err) {
      const errorMsg = filterErrorMessage(err);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  const saveToHistory = (
    filename: string,
    score: number,
    tokens: { input: number; output: number; total: number },
    provider: LLMProvider,
    model: string
  ) => {
    const history = getHistory();

    // Update overall tokens
    history.overallInputTokens += tokens.input;
    history.overallOutputTokens += tokens.output;

    // Add new entry with provider and model
    history.entries.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      filename,
      score,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
      provider,
      model,
    });

    saveHistory(history);
  };

  const canEnhance = file && jobDescription.trim() && apiKey.trim() && model.trim() && !loading;

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
        initialProvider={provider}
        initialApiKey={apiKey}
        initialModel={model}
        providerApiKeys={getApiKeys()}
      />
      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />

      {/* Header - Fixed to top */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">ResumeAI</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHistoryOpen(true)}
              title="View History"
            >
              <History className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="relative"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
              {(!apiKey || !model) && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-2">
            <Sparkles className="h-3 w-3" />
            AI-Powered Enhancement
          </div>
          <h2 className="text-3xl font-bold mb-2">
            Transform Your Resume for <span className="text-primary">Any Job</span>
          </h2>
          <p className="text-muted-foreground">
            Upload your resume, paste a job description, and let AI suggest improvements to enhance it.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Upload Resume */}
            <div>
              <h3 className="text-lg font-semibold mb-3">1. Upload Your Resume</h3>
              <ResumeUpload onFileSelect={setFile} selectedFile={file} />
            </div>

            {/* Job Description */}
            <div>
              <h3 className="text-lg font-semibold mb-3">2. Paste Job Description</h3>
              <JobDescriptionInput value={jobDescription} onChange={setJobDescription} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">3. Enhancements Suggestions</h3>
              
              {/* Enhance Button */}
              <div className="mb-4">
                <Button
                  onClick={handleEnhance}
                  disabled={!canEnhance}
                  size="lg"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enhancing Resume...
                    </>
                  ) : (
                    <>
                      Enhance Resume
                      <Sparkles className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Results */}
              {result ? (
                <div className="space-y-4">
                  <MatchingScoreDisplay score={result.score} />
                  {result.modifications && result.modifications.length > 0 && (
                    <ModificationsList modifications={result.modifications} />
                  )}
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-center">
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Analyzing your resume...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {file ? 'Click "Enhance Resume" to get your AI score and analysis' : 'Upload a resume to get started'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">ResumeAI</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered resume enhancement tool that helps you tailor your resume to any job description.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• AI-powered resume analysis</li>
                <li>• Multiple LLM providers with history tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Privacy</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Your data stays private. All API keys and files are stored locally in your browser and never sent to our servers.
              </p>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ResumeAI <span>•</span> All rights reserved
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Powered by AI</span>
              <span>•</span>
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
