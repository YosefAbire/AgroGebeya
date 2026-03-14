import { api } from '../api';

export interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  available_quantity: number;
  reserved_quantity: number;
  unit: string;
  low_stock_threshold: number;
  last_updated: string;
}

export interface InventoryAdjustment {
  product_id: number;
  quantity_change: number;
  reason: string;
  notes?: string;
}

export interface InventoryStats {
  total_products: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_value: number;
}

class InventoryService {
  /**
   * Get all inventory items for the current user
   */
  async getInventory(token: string): Promise<InventoryItem[]> {
    return api.get<InventoryItem[]>('/api/v1/products', token);
  }

  /**
   * Get inventory statistics
   */
  async getStats(token: string): Promise<InventoryStats> {
    const products = await this.getInventory(token);
    
    const stats: InventoryStats = {
      total_products: products.length,
      low_stock_items: products.filter(p => p.available_quantity > 0 && p.available_quantity <= (p.low_stock_threshold || 10)).length,
      out_of_stock_items: products.filter(p => p.available_quantity === 0).length,
      total_value: products.reduce((sum, p) => sum + (p.available_quantity * (p as any).price || 0), 0),
    };
    
    return stats;
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(token: string): Promise<InventoryItem[]> {
    const products = await this.getInventory(token);
    return products.filter(p => 
      p.available_quantity > 0 && 
      p.available_quantity <= (p.low_stock_threshold || 10)
    );
  }

  /**
   * Get out of stock items
   */
  async getOutOfStockItems(token: string): Promise<InventoryItem[]> {
    const products = await this.getInventory(token);
    return products.filter(p => p.available_quantity === 0);
  }

  /**
   * Adjust inventory (increase or decrease stock)
   */
  async adjustInventory(
    productId: number,
    adjustment: InventoryAdjustment,
    token: string
  ): Promise<InventoryItem> {
    // This would typically be a dedicated endpoint
    // For now, we'll update the product's available_quantity
    const product = await api.get<any>(`/api/v1/products/${productId}`, token);
    const newQuantity = product.available_quantity + adjustment.quantity_change;
    
    return api.put<InventoryItem>(
      `/api/v1/products/${productId}`,
      { available_quantity: Math.max(0, newQuantity) },
      token
    );
  }

  /**
   * Set low stock threshold for a product
   */
  async setLowStockThreshold(
    productId: number,
    threshold: number,
    token: string
  ): Promise<InventoryItem> {
    return api.put<InventoryItem>(
      `/api/v1/products/${productId}`,
      { low_stock_threshold: threshold },
      token
    );
  }
}

export const inventoryService = new InventoryService();
