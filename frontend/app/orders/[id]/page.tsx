'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/use-auth'
import { orderService } from '@/lib/order-service'
import { Order } from '@/lib/types'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { ArrowLeft, Package, CheckCircle2, XCircle, Clock, Truck, CreditCard, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const STATUS_TIMELINE = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'pending_payment', label: 'Awaiting Payment', icon: CreditCard },
  { key: 'paid', label: 'Paid', icon: CheckCircle2 },
  { key: 'completed', label: 'Completed', icon: Truck },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  pending_payment: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  completed: 'bg-green-200 text-green-900',
  delivered: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
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

  const handleStatusUpdate = async (newStatus: Order['status'], reason?: string) => {
    if (!token || !order) return
    setUpdating(true)
    try {
      const updated = await orderService.updateOrderStatus(order.id, newStatus, token)
      setOrder(updated)
      toast.success(`Order ${newStatus.replace('_', ' ')}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order')
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
      router.push('/orders')
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order')
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
        <Link href="/orders"><Button variant="outline">Back to Orders</Button></Link>
      </main>
    </div>
  )

  const isFarmer = user?.id !== undefined && Number(user.id) === order.farmer_id
  const isRetailer = user?.id !== undefined && Number(user.id) === order.retailer_id
  const currentStep = STATUS_TIMELINE.findIndex(s => s.key === order.status)
  const isTerminal = ['rejected', 'cancelled', 'completed', 'delivered'].includes(order.status)

  const paymentDeadline = order.payment_deadline ? new Date(order.payment_deadline) : null
  const deadlinePassed = paymentDeadline ? paymentDeadline < new Date() : false

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Order #{order.id}</h1>
            <p className="text-muted-foreground text-sm">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
            {order.status.replace('_', ' ')}
          </span>
        </div>

        {/* Status Timeline */}
        {!isTerminal && (
          <Card>
            <CardHeader><CardTitle className="text-base">Order Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center">
                {STATUS_TIMELINE.map((step, i) => {
                  const Icon = step.icon
                  const done = i <= currentStep
                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className={`flex flex-col items-center gap-1 ${i < STATUS_TIMELINE.length - 1 ? 'flex-1' : ''}`}>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${done ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={`text-xs text-center ${done ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{step.label}</span>
                      </div>
                      {i < STATUS_TIMELINE.length - 1 && (
                        <div className={`h-0.5 flex-1 mx-1 mb-5 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancelled/Rejected Banner */}
        {(order.status === 'cancelled' || order.status === 'rejected') && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800 capitalize">{order.status}</p>
              {order.cancellation_reason && <p className="text-sm text-red-700 mt-1">{order.cancellation_reason}</p>}
              {order.cancelled_at && <p className="text-xs text-red-600 mt-1">{new Date(order.cancelled_at).toLocaleString()}</p>}
            </div>
          </div>
        )}

        {/* Payment Deadline Warning */}
        {order.status === 'pending_payment' && paymentDeadline && (
          <div className={`flex items-start gap-3 rounded-lg border p-4 ${deadlinePassed ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
            <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${deadlinePassed ? 'text-red-600' : 'text-orange-600'}`} />
            <div>
              <p className={`font-medium ${deadlinePassed ? 'text-red-800' : 'text-orange-800'}`}>
                {deadlinePassed ? 'Payment deadline passed — order will be auto-cancelled' : 'Payment required'}
              </p>
              <p className={`text-sm mt-1 ${deadlinePassed ? 'text-red-700' : 'text-orange-700'}`}>
                Deadline: {paymentDeadline.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Order Details */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Order Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Product</p>
                <p className="font-medium">{order.product_name || `Product #${order.product_id}`}</p>
                <p className="text-xs text-muted-foreground">{order.product_unit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{order.quantity} {order.product_unit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Price</p>
                <p className="font-semibold text-primary">{order.total_price.toLocaleString()} ETB</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment</p>
                <p className="font-medium capitalize">{order.payment_status || 'unpaid'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{isFarmer ? 'Retailer' : 'Farmer'}</p>
                <p className="font-medium">{isFarmer ? (order.retailer_name || `Retailer #${order.retailer_id}`) : (order.farmer_name || `Farmer #${order.farmer_id}`)}</p>
              </div>
              {order.delivery_date && (
                <div>
                  <p className="text-muted-foreground">Delivery Date</p>
                  <p className="font-medium">{new Date(order.delivery_date).toLocaleDateString()}</p>
                </div>
              )}
              {order.paid_at && (
                <div>
                  <p className="text-muted-foreground">Paid At</p>
                  <p className="font-medium">{new Date(order.paid_at).toLocaleString()}</p>
                </div>
              )}
              {order.completed_at && (
                <div>
                  <p className="text-muted-foreground">Completed At</p>
                  <p className="font-medium">{new Date(order.completed_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {!isTerminal && (
          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-3">
              {/* Farmer actions */}
              {isFarmer && order.status === 'pending' && (
                <>
                  <Button onClick={() => handleStatusUpdate('approved')} disabled={updating} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle2 className="h-4 w-4 mr-2" />Approve Order
                  </Button>
                  <Button variant="destructive" onClick={() => handleStatusUpdate('rejected')} disabled={updating}>
                    <XCircle className="h-4 w-4 mr-2" />Reject Order
                  </Button>
                </>
              )}
              {isFarmer && order.status === 'paid' && (
                <Button onClick={() => handleStatusUpdate('completed')} disabled={updating} className="bg-green-600 hover:bg-green-700 text-white">
                  <Truck className="h-4 w-4 mr-2" />Mark Completed
                </Button>
              )}

              {/* Retailer actions */}
              {isRetailer && order.status === 'pending_payment' && !deadlinePassed && (
                <Link href={`/payment?order_id=${order.id}`}>
                  <Button className="bg-primary hover:bg-primary/90">
                    <CreditCard className="h-4 w-4 mr-2" />Pay Now
                  </Button>
                </Link>
              )}
              {isRetailer && (order.status === 'pending' || order.status === 'pending_payment') && (
                <Button variant="destructive" onClick={handleCancel} disabled={updating}>
                  <XCircle className="h-4 w-4 mr-2" />Cancel Order
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
