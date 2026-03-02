'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { paymentService } from '@/lib/services/payment-service';
import { CreditCard } from 'lucide-react';

interface PaymentButtonProps {
  orderId: number;
  token: string;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function PaymentButton({ orderId, token, disabled, onSuccess }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const returnUrl = `${window.location.origin}/payment/callback`;
      const response = await paymentService.initialize({ order_id: orderId, return_url: returnUrl }, token);

      // Redirect to Chapa checkout
      window.location.href = response.checkout_url;
    } catch (error: any) {
      alert(error.message || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePayment} disabled={disabled || loading}>
      <CreditCard className="mr-2 h-4 w-4" />
      {loading ? 'Processing...' : 'Pay Now'}
    </Button>
  );
}
