'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Header from '@/components/Header'
import { Search, Filter, ArrowRight, Calendar } from 'lucide-react'
import Link from 'next/link'

interface HistoryOrder {
  id: string
  orderNumber: string
  date: string
  retailer: string
  items: number
  total: number
  status: string
}

export default function OrderHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const mockOrders: HistoryOrder[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001847',
      date: 'Jan 15, 2024',
      retailer: 'Addis Ababa Agro Supplies',
      items: 2,
      total: 45250,
      status: 'In Transit',
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-001846',
      date: 'Jan 10, 2024',
      retailer: 'Dire Dawa Trading',
      items: 3,
      total: 32500,
      status: 'Delivered',
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-001845',
      date: 'Jan 5, 2024',
      retailer: 'Hawassa Market',
      items: 1,
      total: 15800,
      status: 'Delivered',
    },
    {
      id: '4',
      orderNumber: 'ORD-2024-001844',
      date: 'Dec 28, 2023',
      retailer: 'Mekelle Wholesale',
      items: 4,
      total: 58900,
      status: 'Cancelled',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Transit':
        return 'bg-orange-100 text-orange-800'
      case 'Delivered':
        return 'bg-green-100 text-green-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.retailer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Order History</h1>
          <p className="text-muted-foreground mt-2">Track all your past orders and transactions</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by order number or retailer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No orders found matching your search.</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="hover:shadow-lg hover:border-primary transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                      {/* Order Info */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                        <p className="text-lg font-bold text-foreground">{order.orderNumber}</p>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Date</p>
                          <p className="text-foreground">{order.date}</p>
                        </div>
                      </div>

                      {/* Retailer */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Retailer</p>
                        <p className="text-foreground">{order.retailer}</p>
                      </div>

                      {/* Items & Total */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Items • Total</p>
                        <p className="text-foreground">
                          {order.items} item{order.items > 1 ? 's' : ''} • ৳{order.total.toLocaleString()}
                        </p>
                      </div>

                      {/* Status & Arrow */}
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-lg font-medium text-sm ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
