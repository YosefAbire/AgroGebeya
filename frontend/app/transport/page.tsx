'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Header from '@/components/Header'
import { Truck, MapPin, Phone, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { transportService } from '@/lib/services/transport-service'
import { TransportRequest } from '@/lib/types-extended'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  approved: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function TransportPage() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<'shipments' | 'request'>('shipments')
  const [shipments, setShipments] = useState<TransportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    pickup_location: '', delivery_location: '',
    preferred_date: '', weight_kg: '', vehicle_type: 'Pick-up Truck', notes: '',
  })

  const loadShipments = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await transportService.getPending(token)
      setShipments(data)
    } catch {
      setError('Failed to load shipments.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadShipments() }, [loadShipments])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!form.pickup_location.trim()) { setError('Pickup location is required'); return }
    if (!form.delivery_location.trim()) { setError('Delivery location is required'); return }
    setSubmitting(true)
    try {
      await transportService.createRequest({
        order_id: 0, // will be linked to order on backend
        pickup_location: form.pickup_location,
        delivery_location: form.delivery_location,
        preferred_date: form.preferred_date || new Date().toISOString().split('T')[0],
        weight_kg: form.weight_kg ? Number(form.weight_kg) : 0,
        vehicle_type: form.vehicle_type,
        special_instructions: form.notes || undefined,
      }, token)
      setSubmitted(true)
      setForm({ pickup_location: '', delivery_location: '', preferred_date: '', weight_kg: '', vehicle_type: 'Pick-up Truck', notes: '' })
      setTimeout(() => { setSubmitted(false); setActiveTab('shipments'); loadShipments() }, 2000)
    } catch {
      setError('Failed to submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Transport Management</h1>
        <p className="text-muted-foreground mb-8">Track shipments and arrange delivery</p>

        <div className="flex gap-4 mb-8 border-b border-border">
          {(['shipments', 'request'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab === 'shipments' ? 'Active Shipments' : 'Request Transport'}
            </button>
          ))}
        </div>

        {activeTab === 'shipments' && (
          loading ? <LoadingSkeleton type="list" count={3} /> :
          error ? <div className="text-center py-12"><p className="text-destructive mb-4">{error}</p><Button onClick={loadShipments}>Retry</Button></div> :
          shipments.length === 0 ? (
            <EmptyState icon={Truck} title="No active shipments" description="You have no transport requests yet." actionLabel="Request Transport" onAction={() => setActiveTab('request')} />
          ) : (
            <div className="space-y-4">
              {shipments.map(s => (
                <Card key={s.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Request ID</p>
                          <p className="text-lg font-bold">#{s.id}</p>
                        </div>
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-800'}`}>
                          <Truck className="h-4 w-4" />{s.status.replace('_', ' ')}
                        </span>
                        <div className="space-y-2 pt-2 border-t border-border">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-primary mt-0.5" />
                            <div><p className="text-xs text-muted-foreground">Pickup</p><p className="text-sm font-medium">{s.pickup_location}</p></div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-accent mt-0.5" />
                            <div><p className="text-xs text-muted-foreground">Delivery</p><p className="text-sm font-medium">{s.delivery_location}</p></div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {s.driver_name && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Driver</p>
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="font-medium">{s.driver_name}</p>
                              {s.driver_phone && <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Phone className="h-3 w-3" />{s.driver_phone}</p>}
                            </div>
                          </div>
                        )}
                        {s.estimated_delivery && (
                          <div><p className="text-sm text-muted-foreground">Est. Delivery</p><p className="font-medium">{new Date(s.estimated_delivery).toLocaleDateString()}</p></div>
                        )}
                        <div><p className="text-sm text-muted-foreground">Requested</p><p className="font-medium">{new Date(s.created_at).toLocaleDateString()}</p></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {activeTab === 'request' && (
          <Card>
            <CardHeader><CardTitle>Request Transport Service</CardTitle><CardDescription>Book a transport service for your products</CardDescription></CardHeader>
            <CardContent>
              {submitted && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 mb-6">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div><p className="font-medium text-green-900">Request submitted!</p><p className="text-sm text-green-800">We will contact you within 24 hours.</p></div>
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="pickup_location">Pickup Location</Label><Input id="pickup_location" name="pickup_location" value={form.pickup_location} onChange={handleChange} required className="mt-2" /></div>
                  <div><Label htmlFor="delivery_location">Delivery Location</Label><Input id="delivery_location" name="delivery_location" value={form.delivery_location} onChange={handleChange} required className="mt-2" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="preferred_date">Preferred Date</Label><Input id="preferred_date" name="preferred_date" type="date" value={form.preferred_date} onChange={handleChange} className="mt-2" /></div>
                  <div><Label htmlFor="weight_kg">Weight (kg)</Label><Input id="weight_kg" name="weight_kg" type="number" value={form.weight_kg} onChange={handleChange} placeholder="500" className="mt-2" /></div>
                </div>
                <div>
                  <Label htmlFor="vehicle_type">Vehicle Type</Label>
                  <select id="vehicle_type" name="vehicle_type" value={form.vehicle_type} onChange={handleChange} className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mt-2">
                    <option>Pick-up Truck</option><option>Van</option><option>Delivery Truck</option><option>Small Truck</option>
                  </select>
                </div>
                <div><Label htmlFor="notes">Special Instructions</Label><Input id="notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Any special handling requirements..." className="mt-2" /></div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-900">You will receive a quote within 24 hours.</p>
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-11">{submitting ? 'Submitting...' : 'Request Quote'}</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
