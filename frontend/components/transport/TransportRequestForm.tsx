'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { transportService } from '@/lib/services/transport-service';
import { TransportRequestCreate, VehicleType } from '@/lib/types-extended';
import { CheckCircle } from 'lucide-react';

interface TransportRequestFormProps {
  orderId: number;
  token: string;
  onSuccess?: () => void;
}

interface FormData {
  pickup_location: string;
  delivery_location: string;
  preferred_date: string;
  weight_kg: number;
  vehicle_type: VehicleType;
  special_instructions?: string;
}

export function TransportRequestForm({ orderId, token, onSuccess }: TransportRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const requestData: TransportRequestCreate = {
        order_id: orderId,
        pickup_location: data.pickup_location,
        delivery_location: data.delivery_location,
        preferred_date: data.preferred_date,
        weight_kg: Number(data.weight_kg),
        vehicle_type: data.vehicle_type,
        special_instructions: data.special_instructions,
      };

      const response = await transportService.createRequest(requestData, token);
      setTrackingNumber(response.tracking_number);
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to create transport request');
    } finally {
      setLoading(false);
    }
  };

  if (success && trackingNumber) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Transport Request Submitted</h3>
            <p className="text-muted-foreground mb-4">
              Your transport request has been submitted and is pending approval.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-1">Tracking Number</p>
              <p className="text-lg font-mono">{trackingNumber}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get tomorrow's date as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Transport</CardTitle>
        <CardDescription>
          Arrange transportation for your order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="pickup_location">Pickup Location</Label>
            <Textarea
              id="pickup_location"
              placeholder="Enter full pickup address"
              {...register('pickup_location', {
                required: 'Pickup location is required',
                minLength: {
                  value: 10,
                  message: 'Please provide a detailed address',
                },
              })}
            />
            {errors.pickup_location && (
              <p className="text-sm text-destructive">{errors.pickup_location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_location">Delivery Location</Label>
            <Textarea
              id="delivery_location"
              placeholder="Enter full delivery address"
              {...register('delivery_location', {
                required: 'Delivery location is required',
                minLength: {
                  value: 10,
                  message: 'Please provide a detailed address',
                },
              })}
            />
            {errors.delivery_location && (
              <p className="text-sm text-destructive">{errors.delivery_location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_date">Preferred Pickup Date</Label>
            <Input
              id="preferred_date"
              type="date"
              min={minDate}
              {...register('preferred_date', {
                required: 'Preferred date is required',
                validate: (value) => {
                  const selected = new Date(value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return selected > today || 'Date must be in the future';
                },
              })}
            />
            {errors.preferred_date && (
              <p className="text-sm text-destructive">{errors.preferred_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight_kg">Weight (kg)</Label>
            <Input
              id="weight_kg"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="0.0"
              {...register('weight_kg', {
                required: 'Weight is required',
                min: {
                  value: 0.1,
                  message: 'Weight must be greater than 0',
                },
              })}
            />
            {errors.weight_kg && (
              <p className="text-sm text-destructive">{errors.weight_kg.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select
              onValueChange={(value) => setValue('vehicle_type', value as VehicleType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VehicleType.MOTORCYCLE}>Motorcycle (up to 50kg)</SelectItem>
                <SelectItem value={VehicleType.CAR}>Car (up to 200kg)</SelectItem>
                <SelectItem value={VehicleType.VAN}>Van (up to 1000kg)</SelectItem>
                <SelectItem value={VehicleType.TRUCK}>Truck (over 1000kg)</SelectItem>
              </SelectContent>
            </Select>
            {errors.vehicle_type && (
              <p className="text-sm text-destructive">{errors.vehicle_type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_instructions">Special Instructions (Optional)</Label>
            <Textarea
              id="special_instructions"
              placeholder="Any special handling requirements or instructions"
              {...register('special_instructions')}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit Transport Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
