'use client'

import { Eye, Filter, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import OrderList from '@/components/OrderList'
import { useAuthContext } from '@/components/AuthProvider'
import { orderService } from '@/lib/order-service'
import { Order } from '@/lib/types'

export default function OrdersPage() {
  const { token, user } = useAuthContext()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (token) {
      loadOrders()
    }
  }, [token])

  const loadOrders = async () => {
    if (!token) return
    
    try {
      setIsLoading(true)
      const data = await orderService.getOrders(token)
      setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter orders
  let filteredOrders = orders

  if (statusFilter !== 'all') {
    filteredOrders = filteredOrders.filter((order) => order.status === statusFilter)
  }

  if (searchQuery) {
    filteredOrders = filteredOrders.filter(
      (order) =>
        order.id.toString().includes(searchQuery) ||
        order.product_id.toString().includes(searchQuery)
    )
  }

  const stats = [
    {
      label: 'Total Orders',
      value: orders.length,
      color: 'text-primary',
    },
    {
      label: 'Pending',
      value: orders.filter((o) => o.status === 'pending').length,
      color: 'text-yellow-600',
    },
    {
      label: 'Approved',
      value: orders.filter((o) => o.status === 'approved').length,
      color: 'text-blue-600',
    },
    {
      label: 'Delivered',
      value: orders.filter((o) => o.status === 'delivered').length,
      color: 'text-green-600',
    },
  ]

  // Transform orders for OrderList component
  const transformedOrders = filteredOrders.map(order => ({
    id: order.id.toString(),
    orderNumber: `#ORD-${order.id}`,
    product: `Product #${order.product_id}`,
    quantity: order.quantity,
    unit: 'KG',
    total: order.total_price,
    status: order.status,
    date: new Date(order.created_at),
    retailer: `Retailer #${order.retailer_id}`,
  }))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders Management</h1>
          <p className="mt-1 text-muted-foreground">View and manage all orders from retailers</p>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by order number, product name, or retailer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'border border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-blue-600 text-white'
                  : 'border border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'delivered'
                  ? 'bg-green-600 text-white'
                  : 'border border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              Delivered
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'border border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-muted-foreground">Loading orders...</p>
              </div>
            </div>
          ) : (
            <OrderList orders={transformedOrders} showRetailer={user?.role === 'farmer'} />
          )}
        </div>

        {/* Export Button */}
        <div className="mt-8 flex justify-end">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            <Filter className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </main>
    </div>
  )
}
