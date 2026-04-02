'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { paymentService } from '@/lib/services/payment-service';
import { Transaction, TransactionStatus } from '@/lib/types-extended';
import { formatDistanceToNow } from 'date-fns';

interface TransactionListProps {
  token: string;
}

export function TransactionList({ token }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await paymentService.listTransactions(token);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return 'bg-green-500';
      case TransactionStatus.PENDING:
      case TransactionStatus.PROCESSING:
        return 'bg-yellow-500';
      case TransactionStatus.FAILED:
        return 'bg-red-500';
      case TransactionStatus.REFUNDED:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No transactions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Order #{transaction.order_id}</span>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {transaction.amount} ETB
                </p>
                {transaction.chapa_transaction_ref && (
                  <p className="text-xs text-muted-foreground">
                    Ref: {transaction.chapa_transaction_ref}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
