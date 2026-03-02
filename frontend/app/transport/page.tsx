'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Header from '@/components/Header'
import { Truck, MapPin, Calendar, Phone, CheckCircle2, AlertCircle } from 'lucide-react'

type TransportStatus = 'pending' | 'assigned' | 'in-transit' | 'delivered'

interface Transport {
  id: string
  orderNumber: string
  status: TransportStatus
  pickupLocation: string
  deliveryLocation: string
  driver: string
  vehicle: string
  estimatedDate: string
  cost: number
}

export default function TransportPage() {
  const [activeTab, setActiveTab] = useState<'shipments' | 'request'>('shipments')
  const [newPickup, setNewPickup] = useState('')
  const [newDelivery, setNewDelivery] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const mockShipments: Transport[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001847',
      status: 'in-transit',
      pickupLocation: 'Addis Ababa Warehouse',
      deliveryLocation: 'Dire Dawa Market',
      driver: 'Abebe Kumsa',
      vehicle: 'Toyota Hiace - AAA 5678',
      estimatedDate: 'Jan 20, 2024',
      cost: 2500,
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-001846',
      status: 'delivered',
      pickupLocation: 'Addis Ababa Warehouse',
      deliveryLocation: 'Hawassa Trading Center',
      driver: 'Tsegaye Alemu',
      vehicle: 'Isuzu NPR - AAA 2345',
      estimatedDate: 'Jan 15, 2024',
      cost: 1800,
    },
  ]

  const getStatusColor = (status: TransportStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      case 'assigned':
        return 'bg-blue-100 text-blue-800'
      case 'in-transit':
        return 'bg-orange-100 text-orange-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPickup || !newDelivery) return
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setNewPickup('')
      setNewDelivery('')
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Transport Management</h1>
        <p className="text-muted-foreground mb-8">Track shipments and arrange delivery</p>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('shipments')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'shipments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Active Shipments
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'request'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Request Transport
          </button>
        </div>

        {activeTab === 'shipments' && (
          <div className="space-y-4">
            {mockShipments.map(shipment => (
              <Card key={shipment.id}>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shipment Info */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Order Number</p>
                        <p className="text-lg font-bold text-foreground">{shipment.orderNumber}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(shipment.status)}`}>
                          <Truck className="h-4 w-4" />
                          {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}
                        </span>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-border">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Pickup</p>
                            <p className="text-sm font-medium text-foreground">{shipment.pickupLocation}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Delivery</p>
                            <p className="text-sm font-medium text-foreground">{shipment.deliveryLocation}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Driver & Vehicle Info */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Driver Information</p>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="font-medium text-foreground">{shipment.driver}</p>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            +251 911 234 567
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Vehicle</p>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="font-medium text-foreground">{shipment.vehicle}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Estimated: {shipment.estimatedDate}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Transport Cost</p>
                        <p className="text-2xl font-bold text-primary">৳{shipment.cost.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'request' && (
          <Card>
            <CardHeader>
              <CardTitle>Request Transport Service</CardTitle>
              <CardDescription>Book a transport service for your products</CardDescription>
            </CardHeader>
            <CardContent>
              {submitted && (
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex gap-3 mb-6">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Transport request submitted!</p>
                    <p className="text-sm text-green-800 dark:text-green-200">We'll contact you within 24 hours with a quote.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pickupLoc">Pickup Location</Label>
                    <Input
                      id="pickupLoc"
                      value={newPickup}
                      onChange={(e) => setNewPickup(e.target.value)}
                      placeholder="Where to pick up from"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryLoc">Delivery Location</Label>
                    <Input
                      id="deliveryLoc"
                      value={newDelivery}
                      onChange={(e) => setNewDelivery(e.target.value)}
                      placeholder="Where to deliver to"
                      required
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Preferred Date</Label>
                    <Input id="date" type="date" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="distance">Estimated Distance (km)</Label>
                    <Input id="distance" type="number" placeholder="50" className="mt-2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Total Weight (kg)</Label>
                    <Input id="weight" type="number" placeholder="500" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="vehicle">Vehicle Type</Label>
                    <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mt-2">
                      <option>Pick-up Truck</option>
                      <option>Van</option>
                      <option>Delivery Truck</option>
                      <option>Small Truck</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Special Instructions</Label>
                  <Input
                    id="notes"
                    placeholder="Any special handling requirements..."
                    className="mt-2"
                  />
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    You'll receive a quote within 24 hours. Our team will contact you with pricing and availability.
                  </p>
                </div>

                <Button type="submit" className="w-full h-11">
                  Request Quote
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
