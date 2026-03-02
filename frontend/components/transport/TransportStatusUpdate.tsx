'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { transportService } from '@/lib/services/transport-service';
import { TransportRequest, TransportStatus } from '@/lib/types-extended';
import { Truck, CheckCircle, XCircle, MapPin, Calendar, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface TransportStatusUpdateProps {
  transport: TransportRequest;
  token: string;
  onUpdate?: () => void;
}

export function TransportStatusUpdate({ transport, token, onUpdate }: TransportStatusUpdateProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [newStatus, setNewStatus] = useState<TransportStatus>(transport.status);
  const [driverName, setDriverName] = useState(transport.driver_name || '');
  const [driverPhone, setDriverPhone] = useState(transport.driver_phone || '');

  const handleUpdateStatus = async () => {
    if (newStatus === transport.status && driverName === transport.driver_name && driverPhone === transport.driver_phone) {
      toast.error('No changes to update');
      return;
    }

    setProcessing(true);
    try {
      await transportService.updateStatus(transport.id, newStatus, token);
      toast.success('Transport status updated');
      setDialogOpen(false);
      onUpdate?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: TransportStatus) => {
    switch (status) {
      case TransportStatus.PENDING_APPROVAL:
        return 'bg-yellow-500';
      case TransportStatus.APPROVED:
        return 'bg-green-500';
      case TransportStatus.IN_TRANSIT:
        return 'bg-blue-500';
      case TransportStatus.DELIVERED:
        return 'bg-green-600';
      case TransportStatus.REJECTED:
      case TransportStatus.CANCELLED:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: TransportStatus) => {
    switch (status) {
      case TransportStatus.APPROVED:
        return <CheckCircle className="h-4 w-4" />;
      case TransportStatus.IN_TRANSIT:
        return <Truck className="h-4 w-4" />;
      case TransportStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4" />;
      case TransportStatus.REJECTED:
      case TransportStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const availableStatuses = [
    { value: TransportStatus.APPROVED, label: 'Approved' },
    { value: TransportStatus.IN_TRANSIT, label: 'In Transit' },
    { value: TransportStatus.DELIVERED, label: 'Delivered' },
    { value: TransportStatus.CANCELLED, label: 'Cancelled' },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transport Status</CardTitle>
            <Badge className={getStatusColor(transport.status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(transport.status)}
                {transport.status}
              </span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transport Details */}
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
              <p className="font-mono">{transport.tracking_number || 'Not assigned'}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Pickup Location
                </div>
                <p className="text-sm text-muted-foreground">{transport.pickup_location}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <MapPin className="h-4 w-4 text-red-600" />
                  Delivery Location
                </div>
                <p className="text-sm text-muted-foreground">{transport.delivery_location}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Preferred Date</p>
                <p className="text-sm font-medium">
                  {new Date(transport.preferred_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="text-sm font-medium">{transport.weight_kg} kg</p>
              </div>
            </div>

            {transport.driver_name && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="text-sm font-medium mb-2">Driver Information</p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Name:</span> {transport.driver_name}
                  </p>
                  {transport.driver_phone && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Phone:</span> {transport.driver_phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {transport.special_instructions && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Special Instructions</p>
                <p className="text-sm">{transport.special_instructions}</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Last updated {formatDistanceToNow(new Date(transport.updated_at), { addSuffix: true })}
            </div>
          </div>

          {/* Update Button */}
          {transport.status !== TransportStatus.DELIVERED && 
           transport.status !== TransportStatus.REJECTED && 
           transport.status !== TransportStatus.CANCELLED && (
            <Button onClick={() => setDialogOpen(true)} className="w-full">
              Update Status
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Transport Status</DialogTitle>
            <DialogDescription>
              Update the status and driver information for this transport request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as TransportStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_name">Driver Name</Label>
              <Input
                id="driver_name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter driver name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_phone">Driver Phone</Label>
              <Input
                id="driver_phone"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="Enter driver phone"
              />
            </div>

            {newStatus === TransportStatus.DELIVERED && (
              <Alert>
                <AlertDescription>
                  Marking as delivered will also update the order status to completed.
                </AlertDescription>
              </Alert>
            )}

            {newStatus === TransportStatus.CANCELLED && (
              <Alert variant="destructive">
                <AlertDescription>
                  Cancelling this transport request cannot be undone.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={processing}>
              {processing ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
