'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Header from '@/components/Header'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface InventoryItem {
  id: string
  productName: string
  quantity: number
  unit: string
  minThreshold: number
  maxThreshold: number
  location: string
  lastRestocked: string
  status: 'low' | 'optimal' | 'overstock'
}

export default function InventoryOverviewPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const mockInventory: InventoryItem[] = [
    {
      id: '1',
      productName: 'Teff Flour',
      quantity: 150,
      unit: 'kg',
      minThreshold: 100,
      maxThreshold: 500,
      location: 'Warehouse A - Shelf 1',
      lastRestocked: 'Jan 15, 2024',
      status: 'optimal',
    },
    {
      id: '2',
      productName: 'Wheat',
      quantity: 45,
      unit: 'kg',
      minThreshold: 100,
      maxThreshold: 500,
      location: 'Warehouse A - Shelf 2',
      lastRestocked: 'Jan 10, 2024',
      status: 'low',
    },
    {
      id: '3',
      productName: 'Barley',
      quantity: 650,
      unit: 'kg',
      minThreshold: 200,
      maxThreshold: 600,
      location: 'Warehouse B - Shelf 1',
      lastRestocked: 'Jan 20, 2024',
      status: 'overstock',
    },
    {
      id: '4',
      productName: 'Maize',
      quantity: 280,
      unit: 'kg',
      minThreshold: 150,
      maxThreshold: 400,
      location: 'Warehouse A - Shelf 3',
      lastRestocked: 'Jan 14, 2024',
      status: 'optimal',
    },
    {
      id: '5',
      productName: 'Fertilizer NPK',
      quantity: 30,
      unit: 'bags',
      minThreshold: 50,
      maxThreshold: 200,
      location: 'Warehouse C - Shelf 1',
      lastRestocked: 'Jan 5, 2024',
      status: 'low',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle }
      case 'optimal':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 }
      case 'overstock':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: TrendingUp }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle2 }
    }
  }

  const filteredInventory = mockInventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalItems: mockInventory.reduce((sum, item) => sum + item.quantity, 0),
    lowStockCount: mockInventory.filter(item => item.status === 'low').length,
    overstockCount: mockInventory.filter(item => item.status === 'overstock').length,
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Inventory Overview</h1>
          <p className="text-muted-foreground mt-2">Monitor stock levels and manage your inventory</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Stock</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalItems}</p>
              <p className="text-xs text-muted-foreground mt-2">Across all products</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Low Stock Alerts</p>
              <p className="text-3xl font-bold text-red-600">{stats.lowStockCount}</p>
              <p className="text-xs text-muted-foreground mt-2">Need immediate restocking</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Overstock Items</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.overstockCount}</p>
              <p className="text-xs text-muted-foreground mt-2">Above maximum threshold</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="all">All Status</option>
            <option value="low">Low Stock</option>
            <option value="optimal">Optimal</option>
            <option value="overstock">Overstock</option>
          </select>
          <Link href="/inventory/adjust">
            <Button variant="outline">Adjust Stock</Button>
          </Link>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>Current stock levels and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Last Restocked</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map(item => {
                    const statusInfo = getStatusColor(item.status)
                    const StatusIcon = statusInfo.icon
                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-muted">
                        <td className="py-4 px-4">
                          <p className="font-medium text-foreground">{item.productName}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-foreground">
                            {item.quantity} {item.unit}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Min: {item.minThreshold} | Max: {item.maxThreshold}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${statusInfo.bg}`}>
                            <StatusIcon className="h-4 w-4" />
                            <span className={`text-sm font-medium capitalize ${statusInfo.text}`}>
                              {item.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-foreground text-sm">{item.location}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-foreground text-sm">{item.lastRestocked}</p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link href={`/inventory/items/${item.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
