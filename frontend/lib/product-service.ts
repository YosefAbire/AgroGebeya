import { api } from './api';
import { Product } from './types';

export const productService = {
  async getProducts(token?: string): Promise<Product[]> {
    return api.get<Product[]>('/api/v1/products', token);
  },

  async getProduct(id: number, token?: string): Promise<Product> {
    return api.get<Product>(`/api/v1/products/${id}`, token);
  },

  async createProduct(data: Partial<Product>, token: string): Promise<Product> {
    return api.post<Product>('/api/v1/products', data, token);
  },

  async updateProduct(id: number, data: Partial<Product>, token: string): Promise<Product> {
    return api.put<Product>(`/api/v1/products/${id}`, data, token);
  },

  async deleteProduct(id: number, token: string): Promise<void> {
    return api.delete<void>(`/api/v1/products/${id}`, token);
  },
};
