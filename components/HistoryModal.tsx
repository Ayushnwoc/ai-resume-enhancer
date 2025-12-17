'use client';

import { useState, useEffect } from 'react';
import { X, History, Trash2 } from 'lucide-react';
import { Card } from '@/components/elements/card';
import { Button } from '@/components/elements/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/elements/tabs';
import { getHistory, clearHistory, type HistoryData, type HistoryEntry } from '@/lib/storage';

export function HistoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [history, setHistory] = useState<HistoryData>({
    overallInputTokens: 0,
    overallOutputTokens: 0,
    entries: [],
  });

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  const loadHistory = () => {
    setHistory(getHistory());
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      clearHistory();
      setHistory({ overallInputTokens: 0, overallOutputTokens: 0, entries: [] });
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-4xl max-h-[90vh] p-6 bg-background overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <h2 className="text-xl font-semibold">History</h2>
          </div>
          <div className="flex items-center gap-2">
            {history.entries.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearHistory}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Request History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Overall Input Tokens</p>
                    <p className="text-3xl font-bold">{history.overallInputTokens.toLocaleString()}</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Overall Output Tokens</p>
                    <p className="text-3xl font-bold">{history.overallOutputTokens.toLocaleString()}</p>
                  </div>
                </Card>
              </div>
              <Card className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-3xl font-bold">{history.entries.length}</p>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto mt-4">
            {history.entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No history yet. Your requests will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.entries
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((entry) => (
                    <Card key={entry.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{entry.filename}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</p>
                            {entry.provider && entry.model && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {entry.provider.charAt(0).toUpperCase() + entry.provider.slice(1)} • {entry.model}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-primary">Score: {entry.score}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Input Tokens: </span>
                            <span className="font-medium">{entry.inputTokens.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Output Tokens: </span>
                            <span className="font-medium">{entry.outputTokens.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total: </span>
                            <span className="font-medium">{(entry.inputTokens + entry.outputTokens).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

