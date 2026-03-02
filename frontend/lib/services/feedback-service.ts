import { api } from '../api';
import { Feedback, FeedbackCreate } from '../types-extended';

export const feedbackService = {
  // Submit feedback
  submit: async (data: FeedbackCreate, token: string): Promise<Feedback> => {
    return api.post<Feedback>('/api/v1/feedback', data, token);
  },

  // Get user's feedback
  getMyFeedback: async (token: string): Promise<Feedback[]> => {
    return api.get<Feedback[]>('/api/v1/feedback/my-feedback', token);
  },

  // Admin: Get all feedback
  getAll: async (
    token: string,
    typeFilter?: string,
    statusFilter?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Feedback[]> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(typeFilter && { type_filter: typeFilter }),
      ...(statusFilter && { status_filter: statusFilter }),
    });
    return api.get<Feedback[]>(`/api/v1/feedback/admin?${params}`, token);
  },

  // Admin: Mark as reviewed
  markReviewed: async (feedbackId: number, token: string): Promise<Feedback> => {
    return api.put<Feedback>(`/api/v1/feedback/admin/${feedbackId}/review`, {}, token);
  },

  // Admin: Mark as resolved
  markResolved: async (
    feedbackId: number,
    resolution: string,
    token: string
  ): Promise<Feedback> => {
    return api.put<Feedback>(
      `/api/v1/feedback/admin/${feedbackId}/resolve`,
      { resolution },
      token
    );
  },
};
