import { api } from '../api';
import { TransportRequest, TransportRequestCreate } from '../types-extended';

export const transportService = {
  // Create transport request
  createRequest: async (data: TransportRequestCreate, token: string): Promise<TransportRequest> => {
    return api.post<TransportRequest>('/api/v1/transport/request', data, token);
  },

  // Get transport details
  get: async (id: number, token: string): Promise<TransportRequest> => {
    return api.get<TransportRequest>(`/api/v1/transport/${id}`, token);
  },

  // Track shipment
  track: async (trackingNumber: string, token: string): Promise<TransportRequest> => {
    return api.get<TransportRequest>(`/api/v1/transport/track/${trackingNumber}`, token);
  },

  // Admin: Get pending approvals
  getPending: async (token: string): Promise<TransportRequest[]> => {
    return api.get<TransportRequest[]>('/api/v1/transport/admin/pending', token);
  },

  // Admin: Approve transport
  approve: async (
    id: number,
    driverName: string,
    driverPhone: string,
    estimatedDelivery: string,
    token: string
  ): Promise<TransportRequest> => {
    return api.post<TransportRequest>(
      `/api/v1/transport/admin/${id}/approve`,
      {
        driver_name: driverName,
        driver_phone: driverPhone,
        estimated_delivery: estimatedDelivery,
      },
      token
    );
  },

  // Admin: Reject transport
  reject: async (id: number, reason: string, token: string): Promise<TransportRequest> => {
    return api.post<TransportRequest>(
      `/api/v1/transport/admin/${id}/reject`,
      { reason },
      token
    );
  },

  // Admin: Update status
  updateStatus: async (
    id: number,
    status: string,
    token: string
  ): Promise<TransportRequest> => {
    return api.put<TransportRequest>(
      `/api/v1/transport/admin/${id}/status`,
      { status },
      token
    );
  },

  // Admin: Bulk approve
  bulkApprove: async (ids: number[], token: string): Promise<{ approved_count: number }> => {
    return api.post<{ approved_count: number }>(
      '/api/v1/transport/admin/bulk-approve',
      { transport_ids: ids },
      token
    );
  },
};
