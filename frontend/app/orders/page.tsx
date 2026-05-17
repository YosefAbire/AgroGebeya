'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { Search, CheckCircle2, XCircle, Eye, Package } from 'lucide-react'
import Header from '@/components/Header'
import Link from 'next/link'
import { useAuthContext } from '@/components/AuthProvider'
import { useSearchParams } from 'next/navigation'
import { orderService } from '@/lib/order-service'
import { Order } from '@/lib/types'
import { toast } from 'sonner'

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  pending_payment: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  completed: 'bg-green-200 text-green-900',
  delivered: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
}

function OrdersContent() {
  const { token, user } = useAuthContext()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [updating, setUpdating] = useState<number | null>(null)

  const loadOrders = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await orderService.getOrders(token)
      setOrders(data)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadOrders() }, [loadOrders])

  const updateStatus = async (orderId: number, newStatus: Order['status']) => {
    if (!token) return
    setUpdating(orderId)
    try {
      await orderService.updateOrderStatus(orderId, newStatus, token)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success(`Order ${newStatus}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    const q = searchQuery.toLowerCase()
    const matchSearch = !q ||
      String(o.id).includes(q) ||
      (o.product_name || '').toLowerCase().includes(q) ||
      (o.retailer_name || '').toLowerCase().includes(q) ||
      (o.farmer_name || '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const stats = [
    { label: 'Total', value: orders.length, color: 'text-primary' },
    { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-600' },
    { label: 'Awaiting Payment', value: orders.filter(o => o.status === 'pending_payment').length, color: 'text-orange-600' },
    { label: 'Paid', value: orders.filter(o => o.status === 'paid').length, color: 'text-blue-600' },
    { label: 'Completed', value: orders.filter(o => o.status === 'completed' || o.status === 'delivered').length, color: 'text-green-600' },
  ]

  const isFarmer = user?.role === 'farmer'

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {isFarmer ? 'Incoming Orders' : 'My Orders'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isFarmer ? 'Review and manage orders from retailers' : 'Track your purchases'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-5 mb-8">
          {stats.map(s => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={isFarmer ? 'Search by order ID, product, or retailer...' : 'Search by order ID or product...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'pending_payment', 'paid', 'approved', 'completed', 'rejected', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize ${
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-secondary'
                }`}
              >
                {s === 'all' ? 'All Orders' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders found</p>
            {!isFarmer && (
              <Link href="/products" className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Browse Products
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Order</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      {isFarmer ? 'Retailer' : 'Farmer'}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Qty</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Total</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(order => (
                    <tr key={order.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">#{order.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{order.product_name || `Product #${order.product_id}`}</p>
                        <p className="text-xs text-muted-foreground">{order.product_unit}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {isFarmer ? (order.retailer_name || `Retailer #${order.retailer_id}`) : (order.farmer_name || `Farmer #${order.farmer_id}`)}
                      </td>
                      <td className="px-4 py-3 text-foreground">{order.quantity} {order.product_unit}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{order.total_price.toLocaleString()} ETB</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Farmer: approve/reject pending orders */}
                          {isFarmer && order.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(order.id, 'approved')} disabled={updating === order.id}
                                className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                                <CheckCircle2 className="h-3.5 w-3.5" />Approve
                              </button>
                              <button onClick={() => updateStatus(order.id, 'rejected')} disabled={updating === order.id}
                                className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                                <XCircle className="h-3.5 w-3.5" />Reject
                              </button>
                            </>
                          )}
                          {/* Farmer: mark paid orders as completed */}
                          {isFarmer && order.status === 'paid' && (
                            <button onClick={() => updateStatus(order.id, 'completed')} disabled={updating === order.id}
                              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                              <CheckCircle2 className="h-3.5 w-3.5" />Complete
                            </button>
                          )}
                          {/* Retailer: pay for pending_payment orders */}
                          {!isFarmer && order.status === 'pending_payment' && (
                            <Link href={`/payment?order_id=${order.id}`}
                              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                              Pay Now
                            </Link>
                          )}
                          <Link
                            href={`/orders/${order.id}`}
                            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" /></div>}>
      <OrdersContent />
    </Suspense>
  )
}
