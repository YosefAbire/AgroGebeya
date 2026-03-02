import { api } from './api';
import { Order } from './types';

export const orderService = {
  async getOrders(token: string): Promise<Order[]> {
    return api.get<Order[]>('/api/orders', token);
  },

  async getOrder(id: number, token: string): Promise<Order> {
    return api.get<Order>(`/api/orders/${id}`, token);
  },

  async createOrder(data: Partial<Order>, token: string): Promise<Order> {
    return api.post<Order>('/api/orders', data, token);
  },

  async updateOrderStatus(
    id: number,
    status: Order['status'],
    token: string
  ): Promise<Order> {
    return api.put<Order>(`/api/orders/${id}/status`, { status }, token);
  },
};
