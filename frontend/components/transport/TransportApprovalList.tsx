'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { transportService } from '@/lib/services/transport-service';
import { TransportRequest } from '@/lib/types-extended';
import { CheckCircle, XCircle, Package, MapPin, Calendar, Weight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface TransportApprovalListProps {
  token: string;
  onApprove?: () => void;
  onReject?: () => void;
}

export function TransportApprovalList({ token, onApprove, onReject }: TransportApprovalListProps) {
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(new Set());
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<TransportRequest | null>(null);
  const [processing, setProcessing] = useState(false);

  // Approve form data
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  // Reject form data
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await transportService.getPending(token);
      setRequests(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load transport requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRequest = (requestId: number) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRequests.size === requests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(requests.map((r) => r.id)));
    }
  };

  const openApproveDialog = (request: TransportRequest) => {
    setCurrentRequest(request);
    setDriverName('');
    setDriverPhone('');
    setEstimatedDelivery('');
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (request: TransportRequest) => {
    setCurrentRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!currentRequest) return;

    setProcessing(true);
    try {
      await transportService.approve(
        currentRequest.id,
        driverName,
        driverPhone,
        estimatedDelivery,
        token
      );
      toast.success('Transport request approved');
      setApproveDialogOpen(false);
      await loadRequests();
      onApprove?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!currentRequest) return;

    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await transportService.reject(currentRequest.id, rejectionReason, token);
      toast.success('Transport request rejected');
      setRejectDialogOpen(false);
      await loadRequests();
      onReject?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRequests.size === 0) {
      toast.error('Please select requests to approve');
      return;
    }

    setProcessing(true);
    try {
      await transportService.bulkApprove(Array.from(selectedRequests), token);
      toast.success(`${selectedRequests.size} requests approved`);
      setSelectedRequests(new Set());
      await loadRequests();
      onApprove?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to bulk approve');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading transport requests...</p>
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

  // Get tomorrow's date as minimum for estimated delivery
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pending Transport Approvals</CardTitle>
            {requests.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedRequests.size === requests.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedRequests.size > 0 && (
                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={processing}
                  >
                    Approve Selected ({selectedRequests.size})
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending transport requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedRequests.has(request.id)}
                      onCheckedChange={() => handleSelectRequest(request.id)}
                    />
                    
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">Order #{request.order_id}</p>
                          <p className="text-sm text-muted-foreground">
                            Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>

                      {/* Locations */}
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <MapPin className="h-4 w-4 text-green-600" />
                            Pickup
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">
                            {request.pickup_location}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <MapPin className="h-4 w-4 text-red-600" />
                            Delivery
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">
                            {request.delivery_location}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Preferred:</span>
                          <span>{new Date(request.preferred_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Weight:</span>
                          <span>{request.weight_kg} kg</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Vehicle:</span>
                          <span>{request.vehicle_type}</span>
                        </div>
                      </div>

                      {/* Special Instructions */}
                      {request.special_instructions && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">Special Instructions</p>
                          <p className="text-sm text-muted-foreground">
                            {request.special_instructions}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => openApproveDialog(request)}
                          disabled={processing}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(request)}
                          disabled={processing}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Transport Request</DialogTitle>
            <DialogDescription>
              Assign driver details and approve this transport request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driver_name">Driver Name (Optional)</Label>
              <Input
                id="driver_name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter driver name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver_phone">Driver Phone (Optional)</Label>
              <Input
                id="driver_phone"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="Enter driver phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_delivery">Estimated Delivery Date (Optional)</Label>
              <Input
                id="estimated_delivery"
                type="date"
                min={minDate}
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transport Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this transport request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Rejection Reason</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
