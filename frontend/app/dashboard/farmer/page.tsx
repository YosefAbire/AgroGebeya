'use client'

import { Plus, TrendingUp, PackageOpen, ShoppingCart, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import StatsCard from '@/components/StatsCard'
import OrderList from '@/components/OrderList'
import { VerificationBanner } from '@/components/verification/VerificationBanner'
import { useAuth } from '@/hooks/use-auth'
import { dashboardService, DashboardStats, RecentOrder } from '@/lib/services/dashboard-service'
import { toast } from 'sonner'

export default function FarmerDashboard() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      loadDashboardData()
    }
  }, [token])

  const loadDashboardData = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const [statsData, ordersData] = await Promise.all([
        dashboardService.getFarmerStats(token),
        dashboardService.getFarmerRecentOrders(token, 4)
      ])
      setStats(statsData)
      setRecentOrders(ordersData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      icon: PackageOpen,
      label: 'Total Products Listed',
      value: loading ? '...' : (stats?.total_products?.toString() || '0'),
      color: 'primary' as const,
    },
    {
      icon: ShoppingCart,
      label: 'Pending Orders',
      value: loading ? '...' : (stats?.pending_orders?.toString() || '0'),
      color: 'accent' as const,
    },
    {
      icon: DollarSign,
      label: 'Total Earnings',
      value: loading ? '...' : `${stats?.total_earnings?.toLocaleString() || '0'} ETB`,
      color: 'secondary' as const,
    },
    {
      icon: TrendingUp,
      label: 'Active Listings',
      value: loading ? '...' : (stats?.active_listings?.toString() || '0'),
      color: 'primary' as const,
    },
  ]

  // Transform API data to OrderList format
  const transformedOrders = recentOrders.map(order => ({
    id: order.id.toString(),
    orderNumber: order.order_number,
    product: order.product_name,
    quantity: order.quantity,
    unit: order.unit,
    total: order.total_price,
    status: order.status as 'pending' | 'approved' | 'rejected' | 'delivered',
    date: new Date(order.created_at),
    retailer: order.retailer_name || 'Unknown Retailer',
  }))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Verification Banner */}
        {token && <VerificationBanner token={token} />}

        {/* Page Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Farmer Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Welcome back, {user?.full_name || user?.username}! Here's your agricultural business overview.
            </p>
          </div>
          <Link
            href="/products/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            Add New Product
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <StatsCard
              key={index}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              color={stat.color}
            />
          ))}
        </div>

        {/* Recent Orders Section */}
        <div className="mt-12">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Recent Orders</h2>
              <p className="mt-1 text-sm text-muted-foreground">Orders from retailers for your products</p>
            </div>
            <Link
              href="/orders"
              className="text-sm font-semibold text-primary hover:text-primary/90 transition-colors whitespace-nowrap"
            >
              View All Orders →
            </Link>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-4 text-muted-foreground">Loading orders...</p>
                </div>
              </div>
            ) : transformedOrders.length > 0 ? (
              <OrderList orders={transformedOrders} showRetailer={true} />
            ) : (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No orders yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Orders from retailers will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Link
            href="/products"
            className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackageOpen className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">Manage Products</h3>
            <p className="text-sm text-muted-foreground">Add, edit, or remove your product listings</p>
          </Link>

          <Link
            href="/orders"
            className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">View Orders</h3>
            <p className="text-sm text-muted-foreground">Review and approve orders from retailers</p>
          </Link>

          <Link
            href="/inventory"
            className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">Check Inventory</h3>
            <p className="text-sm text-muted-foreground">Monitor stock levels and availability</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
