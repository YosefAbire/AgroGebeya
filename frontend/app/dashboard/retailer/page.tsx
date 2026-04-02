'use client'

import { MapPin, TrendingUp, PackageOpen, ShoppingCart, DollarSign, Truck } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import StatsCard from '@/components/StatsCard'
import OrderList from '@/components/OrderList'
import { VerificationBanner } from '@/components/verification/VerificationBanner'
import { useAuth } from '@/hooks/use-auth'
import { dashboardService, DashboardStats, RecentOrder } from '@/lib/services/dashboard-service'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function RetailerDashboard() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPurchases, setRecentPurchases] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role !== 'retailer') { router.replace('/dashboard'); return }
  }, [user, router])

  useEffect(() => {
    if (token) {
      loadDashboardData()
    }
  }, [token])

  const loadDashboardData = async () => {
    if (!token) return
    try {
      setLoading(true)
      const [statsData, purchasesData] = await Promise.all([
        dashboardService.getRetailerStats(token),
        dashboardService.getRetailerRecentPurchases(token, 4),
      ])
      setStats(statsData)
      setRecentPurchases(purchasesData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    { icon: ShoppingCart, label: 'Total Orders', value: loading ? '...' : (stats?.total_orders?.toString() || '0'), color: 'primary' as const },
    { icon: Truck, label: 'Pending Deliveries', value: loading ? '...' : (stats?.pending_deliveries?.toString() || '0'), color: 'accent' as const },
    { icon: DollarSign, label: 'Total Spent', value: loading ? '...' : `${stats?.total_spent?.toLocaleString() || '0'} ETB`, color: 'secondary' as const },
    { icon: MapPin, label: 'In Transit', value: loading ? '...' : (stats?.in_transit?.toString() || '0'), color: 'primary' as const },
  ]

  const transformedOrders = recentPurchases.map(order => ({
    id: order.id.toString(),
    orderNumber: order.order_number,
    product: order.product_name,
    quantity: order.quantity,
    unit: order.unit,
    total: order.total_price,
    status: order.status as 'pending' | 'approved' | 'rejected' | 'delivered',
    date: new Date(order.created_at),
    farmer: order.farmer_name || 'Unknown Farmer',
  }))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {token && <VerificationBanner token={token} />}

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Retailer Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Welcome back, {user?.full_name || user?.username}! Here&apos;s your purchasing overview.
            </p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <ShoppingCart className="h-5 w-5" />
            Browse Market
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <StatsCard key={index} icon={stat.icon} label={stat.label} value={stat.value} color={stat.color} />
          ))}
        </div>

        <div className="mt-12">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Recent Purchases</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your latest orders from farmers</p>
            </div>
            <Link href="/orders" className="text-sm font-semibold text-primary hover:text-primary/90 transition-colors whitespace-nowrap">
              View All Purchases →
            </Link>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
                  <p className="mt-4 text-muted-foreground">Loading purchases...</p>
                </div>
              </div>
            ) : transformedOrders.length > 0 ? (
              <OrderList orders={transformedOrders} showFarmer={true} />
            ) : (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No purchases yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Your purchases from farmers will appear here</p>
                <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary/90 transition-colors">
                  Browse Market →
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Link href="/products" className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackageOpen className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">Marketplace</h3>
            <p className="text-sm text-muted-foreground">Browse and buy products from farmers</p>
          </Link>

          <Link href="/orders" className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">Track Deliveries</h3>
            <p className="text-sm text-muted-foreground">Monitor your incoming deliveries</p>
          </Link>

          <Link href="/inventory" className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">My Inventory</h3>
            <p className="text-sm text-muted-foreground">Manage your received products stock</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
