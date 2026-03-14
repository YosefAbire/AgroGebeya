'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { configService } from '@/lib/services/admin-service';
import { SystemConfig } from '@/lib/types-extended';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface ConfigurationPanelProps { token: string }

export function ConfigurationPanel({ token }: ConfigurationPanelProps) {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    configService.getAll(token)
      .then(data => { setConfigs(data); setEdits(Object.fromEntries(data.map(c => [c.key, c.value]))); })
      .catch(() => toast.error('Failed to load configs'))
      .finally(() => setLoading(false));
  }, [token]);

  const save = async (key: string) => {
    setSaving(key);
    try {
      await configService.update(key, edits[key], token);
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: edits[key] } : c));
      toast.success(`Saved ${key}`);
    } catch {
      toast.error(`Failed to save ${key}`);
    } finally {
      setSaving(null);
    }
  };

  const reset = (key: string) => {
    const original = configs.find(c => c.key === key)?.value ?? '';
    setEdits(prev => ({ ...prev, [key]: original }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />System Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
        ) : configs.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No configurations found</p>
        ) : (
          <div className="space-y-4">
            {configs.map(config => (
              <div key={config.key} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{config.key}</p>
                    {config.description && <p className="text-xs text-muted-foreground">{config.description}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={edits[config.key] ?? config.value}
                    onChange={e => setEdits(prev => ({ ...prev, [config.key]: e.target.value }))}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => save(config.key)} disabled={saving === config.key || edits[config.key] === config.value}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => reset(config.key)}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
