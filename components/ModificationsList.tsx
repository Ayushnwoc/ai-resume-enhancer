'use client';

import { Card } from '@/components/elements/card';
import { Badge } from '@/components/elements/badge';
import type { ModificationChunk } from '@/types';

interface ModificationsListProps {
  modifications: ModificationChunk[];
}

export function ModificationsList({ modifications }: ModificationsListProps) {
  if (!modifications || modifications.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-sm">
          No suggestions. Your resume is already well-aligned with the job description.
        </p>
      </Card>
    );
  }

  const groupedBySection = modifications.reduce((acc, mod) => {
    const section = mod.section || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(mod);
    return acc;
  }, {} as Record<string, ModificationChunk[]>);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">ATS-style suggestions</h3>
          <Badge variant="outline">{modifications.length} suggestion{modifications.length !== 1 ? 's' : ''}</Badge>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {Object.entries(groupedBySection).map(([section, mods]) => (
            <div key={section} className="space-y-2">
              <Badge variant="secondary" className="text-xs">
                {section}
              </Badge>
              <ul className="space-y-3 ml-4">
                {mods.map((mod, index) => {
                  const isRemove = mod.suggestionType === 'remove';
                  const label = isRemove ? 'Remove' : 'Add';
                  const content = isRemove ? mod.original : mod.modified;
                  return (
                    <li key={index} className="text-sm">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 shrink-0">
                          {isRemove ? (
                            <span className="text-red-600 dark:text-red-400 font-medium">−</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">+</span>
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            <Badge
                              variant={isRemove ? 'destructive' : 'default'}
                              className="text-xs font-normal mr-1.5"
                            >
                              {label}
                            </Badge>
                            {content}
                          </p>
                          {mod.reason && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              Why: {mod.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}


