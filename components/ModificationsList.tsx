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

  // Group suggestions by section
  const groupedBySection = modifications.reduce((acc, mod) => {
    const section = mod.section || 'General';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(mod);
    return acc;
  }, {} as Record<string, ModificationChunk[]>);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">AI Suggestions</h3>
          <Badge variant="outline">{modifications.length} suggestion{modifications.length !== 1 ? 's' : ''}</Badge>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {Object.entries(groupedBySection).map(([section, mods]) => (
            <div key={section} className="space-y-2">
              <Badge variant="secondary" className="text-xs">
                {section}
              </Badge>
              <ul className="space-y-2 ml-4">
                {mods.map((mod, index) => (
                  <li key={index} className="text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <div className="flex-1">
                        <p className="font-medium">{mod.modified}</p>
                        {mod.reason && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {mod.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}


