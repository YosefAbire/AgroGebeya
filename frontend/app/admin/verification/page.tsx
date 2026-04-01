'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { verificationService } from '@/lib/services/verification-service';
import { VerificationRequest } from '@/lib/types-extended';
import { ShieldCheck, CheckCircle, XCircle, ImageOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function AdminVerificationPage() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    verificationService.getPending(token)
      .then(setRequests)
      .catch(() => toast.error('Failed to load verification requests'))
      .finally(() => setLoading(false));
  }, [token]);

  const approve = async (id: number) => {
    if (!token) return;
    setActionId(id);
    try {
      await verificationService.approve(id, token);
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success('Verification approved');
    } catch { toast.error('Failed to approve'); }
    finally { setActionId(null); }
  };

  const reject = async (id: number) => {
    if (!token) return;
    const reason = rejectReason[id]?.trim();
    if (!reason) { toast.error('Please enter a rejection reason'); return; }
    setActionId(id);
    try {
      await verificationService.reject(id, reason, token);
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success('Verification rejected');
    } catch { toast.error('Failed to reject'); }
    finally { setActionId(null); }
  };

  if (!token) return <p className="p-8 text-center text-muted-foreground">Please log in</p>;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">Verification Requests</h1>
        <Badge variant="outline">{requests.length} pending</Badge>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : requests.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No pending verification requests</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <Card key={req.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Request #{req.id} — User #{req.user_id}</span>
                  <Badge className="bg-yellow-100 text-yellow-800">pending</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Submitted {formatDistanceToNow(new Date(req.submitted_at), { addSuffix: true })}
                </p>

                {/* ID Photos */}
                <div className="grid grid-cols-2 gap-3">
                  {(['id_front_image_url', 'id_back_image_url'] as const).map((key) => {
                    const url = (req as any)[key];
                    const label = key === 'id_front_image_url' ? 'Front of ID' : 'Back of ID';
                    return (
                      <div key={key} className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{label}</p>
                        {url ? (
                          <a href={`${API_BASE_URL}${url}`} target="_blank" rel="noopener noreferrer">
                            <Image
                              src={`${API_BASE_URL}${url}`}
                              alt={label}
                              width={300}
                              height={180}
                              className="w-full rounded-lg border border-border object-cover max-h-44 hover:opacity-90 transition-opacity"
                            />
                          </a>
                        ) : (
                          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                            <div className="text-center">
                              <ImageOff className="h-6 w-6 mx-auto mb-1" />
                              <p className="text-xs">Not uploaded</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Rejection reason (required to reject)"
                    value={rejectReason[req.id] || ''}
                    onChange={e => setRejectReason(prev => ({ ...prev, [req.id]: e.target.value }))}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => approve(req.id)} disabled={actionId === req.id}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => reject(req.id)} disabled={actionId === req.id}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
