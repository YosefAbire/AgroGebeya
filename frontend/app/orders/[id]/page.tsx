'use client'

import { useState, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'
import { ArrowLeft, Download, MessageSquare, Phone, MapPin, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface StatusUpdate {
  status: string
  timestamp: string
  description: string
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [showContactForm, setShowContactForm] = useState(false)

  // Mock order data
  const order = {
    id: id,
    orderNumber: 'ORD-2024-001847',
    retailer: 'Addis Ababa Agro Supplies',
    phone: '+251911234567',
    email: 'contact@addisababa-agro.com',
    createdDate: 'Jan 15, 2024',
    deliveryDate: 'Jan 20, 2024',
    status: 'In Transit',
    totalAmount: 45250,
    items: [
      { name: 'Teff Flour', quantity: 100, unitPrice: 450, total: 45000 },
      { name: 'Fertilizer NPK', quantity: 5, unitPrice: 50, total: 250 },
    ],
    deliveryAddress: '123 Main Street, Addis Ababa, Ethiopia',
    statusUpdates: [
      {
        status: 'Confirmed',
        timestamp: 'Jan 15, 2024 - 10:30 AM',
        description: 'Order confirmed and payment received',
      },
      {
        status: 'Packed',
        timestamp: 'Jan 16, 2024 - 2:15 PM',
        description: 'Products packed and ready for dispatch',
      },
      {
        status: 'In Transit',
        timestamp: 'Jan 17, 2024 - 8:45 AM',
        description: 'Order on the way to delivery address',
      },
    ],
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'Packed':
        return 'bg-purple-100 text-purple-800'
      case 'In Transit':
        return 'bg-orange-100 text-orange-800'
      case 'Delivered':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/orders">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Order Details</h1>
            <p className="text-muted-foreground">Order #{order.orderNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order Status</CardTitle>
                    <CardDescription>Current status of your order</CardDescription>
                  </div>
                  <span className={`px-4 py-2 rounded-lg font-medium text-sm ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {/* Timeline */}
                <div className="space-y-6">
                  {order.statusUpdates.map((update, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        {index < order.statusUpdates.length - 1 && (
                          <div className="h-12 w-1 bg-border mt-2" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium text-foreground">{update.status}</p>
                        <p className="text-sm text-muted-foreground mt-1">{update.timestamp}</p>
                        <p className="text-sm text-foreground mt-2">{update.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} kg × ৳{item.unitPrice}</p>
                      </div>
                      <p className="font-medium text-foreground">৳{item.total.toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">Total Amount</p>
                      <p className="text-xl font-bold text-primary">৳{order.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Retailer Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Seller Name</p>
                  <p className="text-foreground">{order.retailer}</p>
                </div>
                <div className="space-y-2">
                  <a href={`tel:${order.phone}`} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">{order.phone}</span>
                  </a>
                  <a href={`mailto:${order.email}`} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">{order.email}</span>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Address</p>
                    <p className="text-sm text-foreground">{order.deliveryAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Expected Delivery</p>
                    <p className="text-sm text-foreground">{order.deliveryDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full bg-transparent" variant="outline" startIcon={<Download className="h-4 w-4" />}>
                Download Invoice
              </Button>
              <Button
                className="w-full bg-transparent"
                variant="outline"
                startIcon={<MessageSquare className="h-4 w-4" />}
                onClick={() => setShowContactForm(!showContactForm)}
              >
                Contact Seller
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
