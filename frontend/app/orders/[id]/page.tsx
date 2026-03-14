'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/use-auth'
import { orderService } from '@/lib/order-service'
import { Order } from '@/lib/types'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { ArrowLeft, Package, CheckCircle, XCircle, Clock, Truck } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const STATUS_STEPS = ['pending', 'approved', 'delivered']

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-5 w-5" />,
  approved: <CheckCircle className="h-5 w-5" />,
  delivered: <Truck className="h-5 w-5" />,
  rejected: <XCircle className="h-5 w-5" />,
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token, user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const loadOrder = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await orderService.getOrder(Number(id), token)
      setOrder(data)
    } catch {
      setError('Failed to load order.')
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useEffect(() => { loadOrder() }, [loadOrder])

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!token || !order) return
    setUpdating(true)
    try {
      const updated = await orderService.updateOrderStatus(order.id, newStatus, token)
      setOrder(updated)
      toast.success(`Order ${newStatus}`)
    } catch {
      toast.error('Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (!token || !order || !confirm('Cancel this order?')) return
    setUpdating(true)
    try {
      await orderService.cancelOrder(order.id, token)
      toast.success('Order cancelled')
      router.push('/orders/history')
    } catch {
      toast.error('Failed to cancel order')
      setUpdating(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8"><LoadingSkeleton type="list" count={3} /></main>
    </div>
  )

  if (error || !order) return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-destructive mb-4">{error || 'Order not found'}</p>
        <Link href="/orders/history"><Button variant="outline">Back to Orders</Button></Link>
      </main>
    </div>
  )

  const isFarmer = user?.id !== undefined && Number(user.id) === order.farmer_id
  const isRetailer = user?.id !== undefined && Number(user.id) === order.retailer_id
  const currentStep = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/orders/history">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Order #{order.id}</h1>
            <p className="text-muted-foreground text-sm">{new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Status Timeline */}
        {order.status !== 'rejected' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Order Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-2 flex-1">
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                      i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {STATUS_ICONS[step]}
                      <span className="capitalize">{step}</span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Status</p>
                <Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge>
              </div>
              <div><p className="text-muted-foreground">Payment</p>
                <Badge variant="outline">{(order as any).payment_status || 'unpaid'}</Badge>
              </div>
              <div><p className="text-muted-foreground">Quantity</p><p className="font-medium">{order.quantity} units</p></div>
              <div><p className="text-muted-foreground">Total Price</p><p className="font-medium">ETB {order.total_price.toLocaleString()}</p></div>
              {order.delivery_date && (
                <div><p className="text-muted-foreground">Delivery Date</p>
                  <p className="font-medium">{new Date(order.delivery_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6 flex flex-wrap gap-3">
            {isFarmer && order.status === 'pending' && (
              <>
                <Button onClick={() => handleStatusUpdate('approved')} disabled={updating}>Approve Order</Button>
                <Button variant="destructive" onClick={() => handleStatusUpdate('rejected')} disabled={updating}>Reject Order</Button>
              </>
            )}
            {isFarmer && order.status === 'approved' && (
              <Button onClick={() => handleStatusUpdate('delivered')} disabled={updating}>Mark Delivered</Button>
            )}
            {isRetailer && order.status === 'pending' && (
              <Button variant="destructive" onClick={handleCancel} disabled={updating}>Cancel Order</Button>
            )}
            {isRetailer && order.status === 'approved' && (order as any).payment_status !== 'paid' && (
              <Link href={`/payment?order_id=${order.id}`}>
                <Button>Pay Now</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
