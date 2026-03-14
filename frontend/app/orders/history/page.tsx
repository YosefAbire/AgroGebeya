'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Header from '@/components/Header'
import { Search, ArrowRight, Calendar, Package } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { orderService } from '@/lib/order-service'
import { Order } from '@/lib/types'
import { toast } from 'sonner'import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function OrderHistoryPage() {
  const { token } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadOrders = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const data = await orderService.getOrders(token)
      setOrders(data)
    } catch (err) {
      setError('Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }, [token])

  const handleCancel = async (e: React.MouseEvent, orderId: number) => {
    e.preventDefault()
    if (!token || !confirm('Cancel this order?')) return
    try {
      await orderService.cancelOrder(orderId, token)
      setOrders(prev => prev.filter(o => o.id !== orderId))
      toast.success('Order cancelled')
    } catch {
      toast.error('Failed to cancel order')
    }
  }

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const filtered = orders.filter(o => {
    const matchSearch = String(o.id).includes(searchTerm) || String(o.product_id).includes(searchTerm)
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Order History</h1>
          <p className="text-muted-foreground mt-2">Track all your past orders and transactions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <LoadingSkeleton type="list" count={4} />
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={loadOrders}>Retry</Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders found"
            description={searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'You have no orders yet.'}
            actionLabel="Browse Products"
            actionHref="/products"
          />
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <div key={order.id} className="relative">
                <Link href={`/orders/${order.id}`}>
                  <Card className="hover:shadow-lg hover:border-primary transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                          <p className="text-lg font-bold text-foreground">#{order.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Date</p>
                            <p className="text-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Qty • Total</p>
                          <p className="text-foreground">
                            {order.quantity} units • ETB {order.total_price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-lg font-medium text-sm ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                          {order.status === 'pending' ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => handleCancel(e, order.id)}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
