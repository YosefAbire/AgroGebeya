'use client'

import { Plus, ShoppingCart, TrendingDown, DollarSign, Package, AlertCircle } from 'lucide-react'
import Header from '@/components/Header'
import StatsCard from '@/components/StatsCard'
import OrderList from '@/components/OrderList'
import Link from 'next/link'

export default function RetailerDashboard() {
  // Mock data for retailer
  const stats = [
    {
      icon: ShoppingCart,
      label: 'Total Orders',
      value: '42',
      trend: { value: 8, isPositive: true },
      color: 'primary' as const,
    },
    {
      icon: Package,
      label: 'Products Ordered',
      value: '156',
      trend: { value: 12, isPositive: true },
      color: 'accent' as const,
    },
    {
      icon: DollarSign,
      label: 'Total Spent',
      value: '125,000 ETB',
      trend: { value: 5, isPositive: true },
      color: 'secondary' as const,
    },
    {
      icon: TrendingDown,
      label: 'Avg. Order Value',
      value: '2,976 ETB',
      trend: { value: 2, isPositive: false },
      color: 'primary' as const,
    },
  ]

  const myOrders = [
    {
      id: '1',
      orderNumber: '#ORD-2001',
      product: 'Organic Tomatoes',
      quantity: 100,
      unit: 'KG',
      total: 2500,
      status: 'approved' as const,
      date: new Date('2024-01-20'),
      farmer: 'John Doe Farm',
    },
    {
      id: '2',
      orderNumber: '#ORD-2002',
      product: 'Fresh Onions',
      quantity: 50,
      unit: 'KG',
      total: 1500,
      status: 'delivered' as const,
      date: new Date('2024-01-19'),
      farmer: 'Mountain Farms',
    },
    {
      id: '3',
      orderNumber: '#ORD-2003',
      product: 'Red Potatoes',
      quantity: 200,
      unit: 'KG',
      total: 4000,
      status: 'pending' as const,
      date: new Date('2024-01-18'),
      farmer: 'Prime Agriculture',
    },
  ]

  const topProducts = [
    { name: 'Tomatoes', orders: 15, totalQty: 450, totalSpent: 11250 },
    { name: 'Onions', orders: 12, totalQty: 280, totalSpent: 8400 },
    { name: 'Potatoes', orders: 10, totalQty: 600, totalSpent: 12000 },
    { name: 'Carrots', orders: 8, totalQty: 240, totalSpent: 5280 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Retailer Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Manage your store inventory and orders from multiple farmers</p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            Place New Order
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              trend={stat.trend}
              color={stat.color}
            />
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {/* My Orders */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Recent Orders</h2>
              <Link
                href="/orders"
                className="text-sm font-semibold text-primary hover:text-primary/90 transition-colors"
              >
                View All →
              </Link>
            </div>
            <OrderList orders={myOrders} showFarmer={true} />
          </div>

          {/* Alerts & Quick Actions */}
          <div className="space-y-6">
            {/* Low Stock Alert */}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Stock Running Low</h3>
                  <p className="mt-1 text-sm text-yellow-800">
                    Tomatoes stock is below your minimum threshold. Consider placing a new order.
                  </p>
                  <Link
                    href="/products?search=tomatoes"
                    className="mt-3 inline-block text-sm font-medium text-yellow-600 hover:text-yellow-700"
                  >
                    Browse Similar Products →
                  </Link>
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground">Top Ordered Products</h3>
              <div className="mt-4 space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="border-b border-border pb-3 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.orders} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{product.totalQty} KG</p>
                        <p className="text-xs text-muted-foreground">{product.totalSpent.toLocaleString()} ETB</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-2">
              <Link
                href="/products"
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                Browse Products
              </Link>
              <Link
                href="/orders"
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Package className="h-5 w-5" />
                Order History
              </Link>
            </div>
          </div>
        </div>

        {/* Recommended Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Recommended for You</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Fresh Cabbage', price: 15, location: 'Mekelle', available: 180 },
              { name: 'Ripe Bananas', price: 35, location: 'Dire Dawa', available: 45 },
              { name: 'Sweet Oranges', price: 40, location: 'Adama', available: 120 },
              { name: 'White Wheat', price: 18, location: 'Arsi Zone', available: 500 },
            ].map((product, index) => (
              <div key={index} className="rounded-lg border border-border bg-card p-4 hover:shadow-lg transition-shadow">
                <div className="flex h-32 items-center justify-center rounded-lg bg-secondary text-4xl">
                  🥬
                </div>
                <h4 className="mt-3 font-semibold text-foreground">{product.name}</h4>
                <p className="text-sm text-muted-foreground">{product.location}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">{product.price} ETB/KG</span>
                  <span className="text-xs text-muted-foreground">{product.available} available</span>
                </div>
                <button className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  Order Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
