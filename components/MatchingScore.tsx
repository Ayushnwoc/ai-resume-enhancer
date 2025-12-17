'use client';

import { Card } from '@/components/elements/card';
import { Progress } from '@/components/elements/progress';
import { Badge } from '@/components/elements/badge';
import type { MatchingScore } from '@/types';

interface MatchingScoreProps {
  score: MatchingScore;
}

export function MatchingScoreDisplay({ score }: MatchingScoreProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600 dark:text-green-400';
    if (value >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (value >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreVariant = (value: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (value >= 80) return 'default';
    if (value >= 60) return 'secondary';
    if (value >= 40) return 'outline';
    return 'destructive';
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Resume Match Score</h3>
            <span className={`text-3xl font-bold ${getScoreColor(score.total)}`}>
              {score.total}/100
            </span>
          </div>
          <Progress value={score.total} className="h-3" />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Score Breakdown</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Keyword Matching</span>
                <Badge variant={getScoreVariant(score.breakdown.keywordMatching)}>
                  {score.breakdown.keywordMatching}%
                </Badge>
              </div>
              <Progress value={score.breakdown.keywordMatching} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Skill Alignment</span>
                <Badge variant={getScoreVariant(score.breakdown.skillAlignment)}>
                  {score.breakdown.skillAlignment}%
                </Badge>
              </div>
              <Progress value={score.breakdown.skillAlignment} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Experience Relevance</span>
                <Badge variant={getScoreVariant(score.breakdown.experienceRelevance)}>
                  {score.breakdown.experienceRelevance}%
                </Badge>
              </div>
              <Progress value={score.breakdown.experienceRelevance} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Fit</span>
                <Badge variant={getScoreVariant(score.breakdown.overallFit)}>
                  {score.breakdown.overallFit}%
                </Badge>
              </div>
              <Progress value={score.breakdown.overallFit} className="h-2" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm leading-relaxed">{score.explanation}</p>
        </div>
      </div>
    </Card>
  );
}


