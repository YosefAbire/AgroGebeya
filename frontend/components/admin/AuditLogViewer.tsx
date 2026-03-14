'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { auditService } from '@/lib/services/admin-service';
import { AuditLog, SecurityAlert } from '@/lib/types-extended';
import { Shield, AlertTriangle, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AuditLogViewerProps { token: string }

export function AuditLogViewer({ token }: AuditLogViewerProps) {
  const [tab, setTab] = useState<'logs' | 'alerts'>('logs');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [actionType, setActionType] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'logs') {
        const data = await auditService.getLogs(
          token, 0, 100,
          actionType || undefined,
          undefined,
          undefined,
          undefined
        );
        setLogs(data);
      } else {
        const data = await auditService.getAlerts(token);
        setAlerts(data);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const SEVERITY_COLORS: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" /> Audit Logs
        </CardTitle>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant={tab === 'logs' ? 'default' : 'outline'} onClick={() => setTab('logs')}>Logs</Button>
          <Button size="sm" variant={tab === 'alerts' ? 'default' : 'outline'} onClick={() => setTab('alerts')}>
            <AlertTriangle className="h-4 w-4 mr-1" /> Security Alerts
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'logs' && (
          <div className="flex gap-2 mb-4">
            <Input placeholder="Filter by action..." value={actionType} onChange={e => setActionType(e.target.value)} className="max-w-xs" />
            <Button size="sm" onClick={load}><Search className="h-4 w-4" /></Button>
          </div>
        )}
        {loading ? (
          <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
        ) : tab === 'logs' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground">
                <th className="text-left py-2 pr-4">Time</th>
                <th className="text-left py-2 pr-4">User</th>
                <th className="text-left py-2 pr-4">Action</th>
                <th className="text-left py-2 pr-4">Resource</th>
                <th className="text-left py-2">IP</th>
              </tr></thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No logs found</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-muted/30">
                    <td className="py-2 pr-4 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </td>
                    <td className="py-2 pr-4">{log.user_id ?? '—'}</td>
                    <td className="py-2 pr-4"><Badge variant="outline">{log.action}</Badge></td>
                    <td className="py-2 pr-4">{log.resource_type}{log.resource_id ? ` #${log.resource_id}` : ''}</td>
                    <td className="py-2 text-xs text-muted-foreground">{log.ip_address ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No security alerts</p>
            ) : alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{alert.alert_type}</span>
                    <Badge className={SEVERITY_COLORS[alert.severity] || ''}>{alert.severity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
