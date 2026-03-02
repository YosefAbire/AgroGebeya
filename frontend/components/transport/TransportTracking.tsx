'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { transportService } from '@/lib/services/transport-service';
import { TransportRequest, TransportStatus } from '@/lib/types-extended';
import { Package, Truck, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TransportTrackingProps {
  trackingNumber: string;
  token: string;
}

export function TransportTracking({ trackingNumber, token }: TransportTrackingProps) {
  const [transport, setTransport] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransport();
    // Refresh every 30 seconds
    const interval = setInterval(loadTransport, 30000);
    return () => clearInterval(interval);
  }, [trackingNumber]);

  const loadTransport = async () => {
    try {
      const data = await transportService.track(trackingNumber, token);
      setTransport(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load transport details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: TransportStatus) => {
    switch (status) {
      case TransportStatus.PENDING:
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case TransportStatus.APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case TransportStatus.ASSIGNED:
        return <Truck className="h-5 w-5 text-blue-500" />;
      case TransportStatus.IN_TRANSIT:
        return <Truck className="h-5 w-5 text-blue-500 animate-pulse" />;
      case TransportStatus.DELIVERED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case TransportStatus.CANCELLED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TransportStatus) => {
    switch (status) {
      case TransportStatus.PENDING:
        return 'bg-yellow-500';
      case TransportStatus.APPROVED:
      case TransportStatus.DELIVERED:
        return 'bg-green-500';
      case TransportStatus.ASSIGNED:
      case TransportStatus.IN_TRANSIT:
        return 'bg-blue-500';
      case TransportStatus.CANCELLED:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { status: TransportStatus.PENDING, label: 'Pending Approval' },
      { status: TransportStatus.APPROVED, label: 'Approved' },
      { status: TransportStatus.ASSIGNED, label: 'Driver Assigned' },
      { status: TransportStatus.IN_TRANSIT, label: 'In Transit' },
      { status: TransportStatus.DELIVERED, label: 'Delivered' },
    ];

    const currentIndex = steps.findIndex((s) => s.status === transport?.status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading transport details...</p>
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

  if (!transport) {
    return (
      <Alert>
        <AlertDescription>Transport request not found</AlertDescription>
      </Alert>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transport Tracking</CardTitle>
            <Badge className={getStatusColor(transport.status)}>
              {transport.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tracking Number */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
            <p className="text-lg font-mono">{transport.tracking_number}</p>
          </div>

          {/* Status Timeline */}
          <div className="space-y-4">
            <p className="text-sm font-medium">Status Timeline</p>
            <div className="space-y-3">
              {statusSteps.map((step, index) => (
                <div key={step.status} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      step.completed
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-current" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        step.current ? 'font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Pickup Location</p>
              </div>
              <p className="text-sm text-muted-foreground">{transport.pickup_location}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Delivery Location</p>
              </div>
              <p className="text-sm text-muted-foreground">{transport.delivery_location}</p>
            </div>
          </div>

          {/* Driver Information */}
          {transport.driver_name && (
            <div className="rounded-lg border p-4">
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

          {/* Additional Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Weight</p>
              <p className="text-sm font-medium">{transport.weight_kg} kg</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vehicle Type</p>
              <p className="text-sm font-medium">{transport.vehicle_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Preferred Date</p>
              <p className="text-sm font-medium">
                {new Date(transport.preferred_date).toLocaleDateString()}
              </p>
            </div>
            {transport.estimated_delivery_date && (
              <div>
                <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                <p className="text-sm font-medium">
                  {new Date(transport.estimated_delivery_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Special Instructions */}
          {transport.special_instructions && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Special Instructions</p>
              <p className="text-sm">{transport.special_instructions}</p>
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground">
            Last updated {formatDistanceToNow(new Date(transport.updated_at), { addSuffix: true })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
