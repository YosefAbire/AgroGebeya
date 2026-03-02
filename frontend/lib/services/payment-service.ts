import { api } from '../api';
import {
  PaymentInitializeRequest,
  PaymentInitializeResponse,
  Transaction,
} from '../types-extended';

export const paymentService = {
  // Initialize payment
  initialize: async (
    data: PaymentInitializeRequest,
    token: string
  ): Promise<PaymentInitializeResponse> => {
    return api.post<PaymentInitializeResponse>('/api/v1/payments/initialize', data, token);
  },

  // Get payment status
  getStatus: async (transactionId: number, token: string): Promise<Transaction> => {
    return api.get<Transaction>(`/api/v1/payments/${transactionId}/status`, token);
  },

  // Verify payment
  verify: async (txRef: string, token: string): Promise<any> => {
    return api.get<any>(`/api/v1/payments/verify/${txRef}`, token);
  },

  // List user's transactions
  listTransactions: async (
    token: string,
    skip: number = 0,
    limit: number = 50,
    status?: string
  ): Promise<Transaction[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });
    return api.get<Transaction[]>(`/api/v1/payments/transactions?${params}`, token);
  },

  // Admin: Process refund
  refund: async (
    transactionId: number,
    amount: number | null,
    reason: string,
    token: string
  ): Promise<any> => {
    return api.post<any>(
      `/api/v1/payments/admin/${transactionId}/refund`,
      { amount, reason },
      token
    );
  },
};
