'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { verificationService } from '@/lib/services/verification-service';
import { CheckCircle } from 'lucide-react';

interface VerificationFormProps {
  token: string;
  onSuccess?: () => void;
}

interface FormData {
  national_id: string;
}

export function VerificationForm({ token, onSuccess }: VerificationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  // Apply custom validation messages
  useEffect(() => {
    if (formRef.current) {
      const input = formRef.current.querySelector('input[name="national_id"]') as HTMLInputElement;
      if (input) {
        input.addEventListener('invalid', (e) => {
          e.preventDefault();
          if (input.validity.valueMissing) {
            input.setCustomValidity('Please enter your National ID');
          } else if (input.validity.patternMismatch) {
            input.setCustomValidity('National ID must be exactly 9 digits');
          }
        });
        
        input.addEventListener('input', () => {
          input.setCustomValidity('');
        });
      }
    }
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      await verificationService.submit(data, token);
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Verification Submitted</h3>
            <p className="text-muted-foreground">
              Your National ID has been submitted for verification. You will be notified once it's reviewed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>National ID Verification</CardTitle>
        <CardDescription>
          Enter your Ethiopian National ID (9 digits) to verify your identity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="national_id">National ID</Label>
            <Input
              id="national_id"
              placeholder="123456789"
              maxLength={9}
              data-field-type="nationalId"
              {...register('national_id', {
                required: 'National ID is required',
                pattern: {
                  value: /^\d{9}$/,
                  message: 'National ID must be exactly 9 digits',
                },
              })}
            />
            {errors.national_id && (
              <p className="text-sm text-destructive">{errors.national_id.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Your National ID will be encrypted and stored securely
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
