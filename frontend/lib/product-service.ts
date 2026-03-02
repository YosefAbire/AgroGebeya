import { api } from './api';
import { Product } from './types';

export const productService = {
  async getProducts(token?: string): Promise<Product[]> {
    return api.get<Product[]>('/api/products', token);
  },

  async getProduct(id: number, token?: string): Promise<Product> {
    return api.get<Product>(`/api/products/${id}`, token);
  },

  async createProduct(data: Partial<Product>, token: string): Promise<Product> {
    return api.post<Product>('/api/products', data, token);
  },

  async updateProduct(id: number, data: Partial<Product>, token: string): Promise<Product> {
    return api.put<Product>(`/api/products/${id}`, data, token);
  },

  async deleteProduct(id: number, token: string): Promise<void> {
    return api.delete<void>(`/api/products/${id}`, token);
  },
};
