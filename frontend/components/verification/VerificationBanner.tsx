'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { verificationService } from '@/lib/services/verification-service';
import { VerificationStatus } from '@/lib/types-extended';
import { useRouter } from 'next/navigation';

interface VerificationBannerProps {
  token: string;
}

export function VerificationBanner({ token }: VerificationBannerProps) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const verification = await verificationService.getStatus(token);
      setStatus(verification.status as VerificationStatus);
    } catch (error) {
      // User hasn't submitted verification yet
      setStatus(VerificationStatus.UNVERIFIED);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === VerificationStatus.VERIFIED) {
    return null;
  }

  const getAlertConfig = () => {
    switch (status) {
      case VerificationStatus.UNVERIFIED:
        return {
          icon: AlertCircle,
          variant: 'destructive' as const,
          title: 'National ID Verification Required',
          description:
            'You need to verify your National ID before you can create products or place orders.',
          action: 'Verify Now',
          onClick: () => router.push('/profile/verification'),
        };
      case VerificationStatus.PENDING:
        return {
          icon: Clock,
          variant: 'default' as const,
          title: 'Verification Pending',
          description: 'Your National ID is being reviewed. This usually takes 1-2 business days.',
          action: null,
          onClick: null,
        };
      case VerificationStatus.REJECTED:
        return {
          icon: XCircle,
          variant: 'destructive' as const,
          title: 'Verification Rejected',
          description: 'Your National ID verification was rejected. Please submit again with correct information.',
          action: 'Resubmit',
          onClick: () => router.push('/profile/verification'),
        };
      default:
        return null;
    }
  };

  const config = getAlertConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className="mb-6">
      <Icon className="h-4 w-4" />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{config.description}</span>
        {config.action && (
          <Button size="sm" onClick={config.onClick!} className="ml-4">
            {config.action}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
