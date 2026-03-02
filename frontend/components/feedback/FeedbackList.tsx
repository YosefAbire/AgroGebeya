'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { feedbackService } from '@/lib/services/feedback-service';
import { Feedback, FeedbackType, FeedbackStatus } from '@/lib/types-extended';
import { MessageSquare, CheckCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface FeedbackListProps {
  token: string;
  isAdmin?: boolean;
}

export function FeedbackList({ token, isAdmin = false }: FeedbackListProps) {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [resolveDialog, setResolveDialog] = useState(false);
  const [resolution, setResolution] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [typeFilter, statusFilter]);

  const loadFeedback = async () => {
    try {
      let data;
      if (isAdmin) {
        const type = typeFilter !== 'all' ? typeFilter : undefined;
        const status = statusFilter !== 'all' ? statusFilter : undefined;
        data = await feedbackService.getAll(token, type, status);
      } else {
        data = await feedbackService.getMyFeedback(token);
      }
      setFeedbackList(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReviewed = async (feedbackId: number) => {
    setProcessing(true);
    try {
      await feedbackService.markReviewed(feedbackId, token);
      toast.success('Feedback marked as reviewed');
      await loadFeedback();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark as reviewed');
    } finally {
      setProcessing(false);
    }
  };

  const openResolveDialog = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResolution('');
    setResolveDialog(true);
  };

  const handleResolve = async () => {
    if (!selectedFeedback || !resolution.trim()) {
      toast.error('Please provide a resolution');
      return;
    }

    setProcessing(true);
    try {
      await feedbackService.markResolved(selectedFeedback.id, resolution, token);
      toast.success('Feedback marked as resolved');
      setResolveDialog(false);
      await loadFeedback();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark as resolved');
    } finally {
      setProcessing(false);
    }
  };

  const getTypeBadge = (type: FeedbackType) => {
    const config = {
      [FeedbackType.BUG_REPORT]: { label: '🐛 Bug', variant: 'destructive' as const },
      [FeedbackType.FEATURE_REQUEST]: { label: '💡 Feature', variant: 'default' as const },
      [FeedbackType.GENERAL_FEEDBACK]: { label: '💬 Feedback', variant: 'secondary' as const },
    };
    const { label, variant } = config[type] || config[FeedbackType.GENERAL_FEEDBACK];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    const config = {
      [FeedbackStatus.PENDING]: { label: 'Pending', variant: 'secondary' as const },
      [FeedbackStatus.REVIEWED]: { label: 'Reviewed', variant: 'default' as const },
      [FeedbackStatus.RESOLVED]: { label: 'Resolved', variant: 'default' as const },
    };
    const { label, variant } = config[status] || config[FeedbackStatus.PENDING];
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading feedback...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {isAdmin ? 'All Feedback' : 'My Feedback'}
            </CardTitle>
            {isAdmin && (
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="bug_report">Bug Report</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="general_feedback">General</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {feedbackList.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No feedback found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackList.map((feedback) => (
                <div key={feedback.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2">
                      {getTypeBadge(feedback.type)}
                      {getStatusBadge(feedback.status)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="text-sm whitespace-pre-wrap">{feedback.description}</p>

                  {feedback.contact_preference && (
                    <div className="bg-muted p-2 rounded text-sm">
                      <span className="font-medium">Contact: </span>
                      {feedback.contact_preference}
                    </div>
                  )}

                  {feedback.admin_notes && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded text-sm">
                      <span className="font-medium">Resolution: </span>
                      {feedback.admin_notes}
                    </div>
                  )}

                  {isAdmin && feedback.status === FeedbackStatus.PENDING && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkReviewed(feedback.id)}
                        disabled={processing}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Mark Reviewed
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openResolveDialog(feedback)}
                        disabled={processing}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  )}

                  {isAdmin && feedback.status === FeedbackStatus.REVIEWED && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => openResolveDialog(feedback)}
                        disabled={processing}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog} onOpenChange={setResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Feedback</DialogTitle>
            <DialogDescription>
              Provide a resolution for this feedback item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Textarea
                id="resolution"
                placeholder="Describe how this feedback was addressed..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={processing || !resolution.trim()}>
              {processing ? 'Resolving...' : 'Mark as Resolved'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
