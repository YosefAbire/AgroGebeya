import { api } from '../api'

export interface DashboardStats {
  total_products?: number
  pending_orders?: number
  total_earnings?: number
  active_listings?: number
  total_orders?: number
  pending_deliveries?: number
  total_spent?: number
  in_transit?: number
}

export interface RecentOrder {
  id: number
  order_number: string
  product_name: string
  quantity: number
  unit: string
  total_price: number
  status: 'pending' | 'approved' | 'rejected' | 'delivered' | 'in_transit'
  created_at: string
  retailer_name?: string
  farmer_name?: string
}

class DashboardService {
  /**
   * Get farmer dashboard statistics
   */
  async getFarmerStats(token: string): Promise<DashboardStats> {
    return api.get<DashboardStats>('/api/v1/dashboard/farmer/stats', token)
  }

  /**
   * Get retailer dashboard statistics
   */
  async getRetailerStats(token: string): Promise<DashboardStats> {
    return api.get<DashboardStats>('/api/v1/dashboard/retailer/stats', token)
  }

  /**
   * Get recent orders for farmer
   */
  async getFarmerRecentOrders(token: string, limit: number = 5): Promise<RecentOrder[]> {
    return api.get<RecentOrder[]>(`/api/v1/dashboard/farmer/recent-orders?limit=${limit}`, token)
  }

  /**
   * Get recent purchases for retailer
   */
  async getRetailerRecentPurchases(token: string, limit: number = 5): Promise<RecentOrder[]> {
    return api.get<RecentOrder[]>(`/api/v1/dashboard/retailer/recent-purchases?limit=${limit}`, token)
  }
}

export const dashboardService = new DashboardService()
