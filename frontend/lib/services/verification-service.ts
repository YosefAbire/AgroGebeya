import { api } from '../api';
import { VerificationRequest, VerificationSubmit, VerificationStatus } from '../types-extended';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const verificationService = {
  // Submit National ID for verification
  submit: async (data: VerificationSubmit, token: string): Promise<VerificationRequest> => {
    return api.post<VerificationRequest>('/api/v1/verification/submit', data, token);
  },

  // Upload front and back ID photos
  uploadIdImages: async (frontImage: File, backImage: File, token: string): Promise<VerificationRequest> => {
    const formData = new FormData();
    formData.append('front_image', frontImage);
    formData.append('back_image', backImage);
    const response = await fetch(`${API_BASE_URL}/api/v1/verification/upload-id-images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload ID images');
    }
    return response.json();
  },

  // Get user's verification status
  getStatus: async (token: string): Promise<{ status: string; submitted_at?: string; reviewed_at?: string; rejection_reason?: string }> => {
    return api.get('/api/v1/verification/status', token);
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
      { rejection_reason: reason },
      token
    );
  },
};
