'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { backupService } from '@/lib/services/admin-service';
import { Backup, BackupStatus } from '@/lib/types-extended';
import { Database, Download, RefreshCw, CheckCircle, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface BackupManagementProps { token: string }

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
};

export function BackupManagement({ token }: BackupManagementProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    backupService.list(token)
      .then(setBackups)
      .catch(() => toast.error('Failed to load backups'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const create = async () => {
    setCreating(true);
    try {
      await backupService.create(token);
      toast.success('Backup created');
      load();
    } catch { toast.error('Failed to create backup'); }
    finally { setCreating(false); }
  };

  const download = async (id: number, filename: string) => {
    setActionId(id);
    try {
      const blob = await backupService.download(id, token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch { toast.error('Download failed'); }
    finally { setActionId(null); }
  };

  const restore = async (id: number) => {
    if (!confirm('Restore this backup? This will overwrite current data.')) return;
    setActionId(id);
    try {
      await backupService.restore(id, token);
      toast.success('Restore initiated');
    } catch { toast.error('Restore failed'); }
    finally { setActionId(null); }
  };

  const verify = async (id: number) => {
    setActionId(id);
    try {
      const result = await backupService.verify(id, token);
      toast[result.is_valid ? 'success' : 'error'](result.is_valid ? 'Backup is valid' : 'Backup is corrupted');
    } catch { toast.error('Verification failed'); }
    finally { setActionId(null); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Backup Management</CardTitle>
          <Button size="sm" onClick={create} disabled={creating}>
            <Plus className="h-4 w-4 mr-1" />{creating ? 'Creating...' : 'Create Backup'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
        ) : backups.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No backups found</p>
        ) : (
          <div className="space-y-3">
            {backups.map(backup => (
              <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{backup.filename}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={STATUS_COLORS[backup.status] || ''}>{backup.status}</Badge>
                    <span className="text-xs text-muted-foreground">{backup.backup_type}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(backup.created_at), { addSuffix: true })}
                    </span>
                    {backup.size_bytes > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {(backup.size_bytes / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                </div>
                {backup.status === BackupStatus.COMPLETED && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => download(backup.id, backup.filename)} disabled={actionId === backup.id}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => verify(backup.id)} disabled={actionId === backup.id}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => restore(backup.id)} disabled={actionId === backup.id}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
