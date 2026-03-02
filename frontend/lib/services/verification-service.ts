import { api } from '../api';
import { VerificationRequest, VerificationSubmit, VerificationStatus } from '../types-extended';

export const verificationService = {
  // Submit National ID for verification
  submit: async (data: VerificationSubmit, token: string): Promise<VerificationRequest> => {
    return api.post<VerificationRequest>('/api/v1/verification/submit', data, token);
  },

  // Get user's verification status
  getStatus: async (token: string): Promise<VerificationRequest> => {
    return api.get<VerificationRequest>('/api/v1/verification/status', token);
  },

  // Admin: Get pending verifications
  getPending: async (token: string): Promise<VerificationRequest[]> => {
    return api.get<VerificationRequest[]>('/api/v1/verification/admin/pending', token);
  },

  // Admin: Approve verification
  approve: async (id: number, token: string): Promise<VerificationRequest> => {
    return api.post<VerificationRequest>(`/api/v1/verification/admin/${id}/approve`, {}, token);
  },

  // Admin: Reject verification
  reject: async (id: number, reason: string, token: string): Promise<VerificationRequest> => {
    return api.post<VerificationRequest>(
      `/api/v1/verification/admin/${id}/reject`,
      { reason },
      token
    );
  },
};
