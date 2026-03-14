'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Header from '@/components/Header'
import { CreditCard, DollarSign, CheckCircle2, Clock, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { orderService } from '@/lib/order-service'
import { api } from '@/lib/api'
import { Order } from '@/lib/types'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { PaymentInitializeResponse } from '@/lib/types-extended'

const PAYMENT_METHODS = [
  { id: 'chapa', name: 'Chapa Payment', icon: CreditCard, description: 'Pay via Telebirr, bank, or card through Chapa' },
  { id: 'cash', name: 'Cash on Delivery', icon: DollarSign, description: 'Pay upon delivery' },
]

export default function PaymentPage() {
  const { token } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [selectedMethod, setSelectedMethod] = useState('chapa')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await orderService.getOrders(token)
      setOrders(data.filter(o => o.status === 'approved' || o.status === 'pending'))
    } catch {
      setError('Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadOrders() }, [loadOrders])

  const selectedOrder = orders.find(o => o.id === selectedOrderId)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !selectedOrderId) return
    setProcessing(true)
    setError(null)
    try {
      if (selectedMethod === 'chapa') {
        const result = await api.post<PaymentInitializeResponse>(
          '/api/v1/payments/initialize',
          { order_id: selectedOrderId, return_url: `${window.location.origin}/payment/success` },
          token
        )
        window.location.href = result.checkout_url
      } else {
        // Cash on delivery — confirm selection, farmer will mark as delivered on receipt
        alert(`Cash on delivery confirmed for Order #${selectedOrderId}. The farmer will mark it delivered upon receipt.`)
        await loadOrders()
        setSelectedOrderId(null)
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Payment Management</h1>
        <p className="text-muted-foreground mb-8">Manage payments for your orders</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Make Payment</CardTitle><CardDescription>Select an order and payment method</CardDescription></CardHeader>
              <CardContent>
                {loading ? <LoadingSkeleton type="form" count={3} /> : (
                  <form onSubmit={handlePay} className="space-y-6">
                    <div>
                      <Label htmlFor="order">Select Order</Label>
                      {orders.length === 0 ? (
                        <p className="text-sm text-muted-foreground mt-2">No pending orders to pay for.</p>
                      ) : (
                        <select
                          id="order"
                          value={selectedOrderId ?? ''}
                          onChange={(e) => setSelectedOrderId(Number(e.target.value) || null)}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mt-2"
                          required
                        >
                          <option value="">Choose an order...</option>
                          {orders.map(o => (
                            <option key={o.id} value={o.id}>
                              Order #{o.id} — ETB {o.total_price.toLocaleString()}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {selectedOrder && (
                      <div className="p-4 bg-secondary/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Amount Due</p>
                        <p className="text-2xl font-bold text-primary">ETB {selectedOrder.total_price.toLocaleString()}</p>
                      </div>
                    )}

                    <div>
                      <Label>Payment Method</Label>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {PAYMENT_METHODS.map(m => (
                          <button key={m.id} type="button" onClick={() => setSelectedMethod(m.id)}
                            className={`p-3 border rounded-lg text-left transition-all ${selectedMethod === m.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <m.icon className="h-4 w-4" />
                              <p className="font-medium text-sm">{m.name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{m.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button type="submit" disabled={!selectedOrderId || processing} className="w-full h-11">
                      {processing ? 'Processing...' : selectedMethod === 'chapa' ? (
                        <span className="flex items-center gap-2">Pay via Chapa <ExternalLink className="h-4 w-4" /></span>
                      ) : 'Confirm Cash on Delivery'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Recent Orders</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {loading ? <LoadingSkeleton type="list" count={2} /> :
                  orders.length === 0 ? (
                    <EmptyState icon={CreditCard} title="No orders" description="No pending orders." />
                  ) : (
                    orders.slice(0, 5).map(o => (
                      <div key={o.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-sm">Order #{o.id}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${o.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {o.status === 'delivered' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {o.status}
                          </span>
                        </div>
                        <p className="text-sm font-bold">ETB {o.total_price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
                      </div>
                    ))
                  )
                }
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
