import { api } from './api';
import { Order } from './types';

export const orderService = {
  async getOrders(token: string): Promise<Order[]> {
    return api.get<Order[]>('/api/v1/orders', token);
  },

  async getOrder(id: number, token: string): Promise<Order> {
    return api.get<Order>(`/api/v1/orders/${id}`, token);
  },

  async createOrder(data: Partial<Order>, token: string): Promise<Order> {
    return api.post<Order>('/api/v1/orders', data, token);
  },

  async updateOrderStatus(
    id: number,
    status: Order['status'],
    token: string
  ): Promise<Order> {
    return api.put<Order>(`/api/v1/orders/${id}/status`, { status }, token);
  },

  async cancelOrder(id: number, token: string): Promise<void> {
    return api.delete(`/api/v1/orders/${id}`, token);
  },
};
