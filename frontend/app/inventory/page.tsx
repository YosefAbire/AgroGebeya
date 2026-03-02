'use client'

import { AlertCircle, Edit2, Search, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import Header from '@/components/Header'
import { useSearchParams, Suspense } from 'next/navigation'
import Loading from './loading'

interface InventoryItem {
  id: string
  productName: string
  category: string
  available: number
  reserved: number
  sold: number
  unit: string
  lastUpdated: Date
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const searchParams = useSearchParams()

  // Mock inventory data
  const inventoryItems: InventoryItem[] = [
    {
      id: '1',
      productName: 'Tomatoes',
      category: 'Vegetables',
      available: 150,
      reserved: 20,
      sold: 1200,
      unit: 'KG',
      lastUpdated: new Date('2024-01-20'),
      status: 'in-stock',
    },
    {
      id: '2',
      productName: 'Onions',
      category: 'Vegetables',
      available: 25,
      reserved: 5,
      sold: 850,
      unit: 'KG',
      lastUpdated: new Date('2024-01-20'),
      status: 'low-stock',
    },
    {
      id: '3',
      productName: 'Potatoes',
      category: 'Vegetables',
      available: 500,
      reserved: 100,
      sold: 2400,
      unit: 'KG',
      lastUpdated: new Date('2024-01-19'),
      status: 'in-stock',
    },
    {
      id: '4',
      productName: 'Carrots',
      category: 'Vegetables',
      available: 0,
      reserved: 0,
      sold: 450,
      unit: 'KG',
      lastUpdated: new Date('2024-01-18'),
      status: 'out-of-stock',
    },
    {
      id: '5',
      productName: 'Bananas',
      category: 'Fruits',
      available: 80,
      reserved: 10,
      sold: 280,
      unit: 'Dozen',
      lastUpdated: new Date('2024-01-20'),
      status: 'in-stock',
    },
    {
      id: '6',
      productName: 'Oranges',
      category: 'Fruits',
      available: 8,
      reserved: 2,
      sold: 320,
      unit: 'KG',
      lastUpdated: new Date('2024-01-20'),
      status: 'low-stock',
    },
  ]

  // Filter inventory
  const filteredItems = inventoryItems.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: InventoryItem['status']) => {
    const styles = {
      'in-stock': 'bg-green-100 text-green-800',
      'low-stock': 'bg-yellow-100 text-yellow-800',
      'out-of-stock': 'bg-red-100 text-red-800',
    }
    return styles[status]
  }

  const getStatusLabel = (status: InventoryItem['status']) => {
    const labels = {
      'in-stock': 'In Stock',
      'low-stock': 'Low Stock',
      'out-of-stock': 'Out of Stock',
    }
    return labels[status]
  }

  const stats = [
    {
      label: 'Total Products',
      value: inventoryItems.length,
      icon: '📦',
    },
    {
      label: 'In Stock',
      value: inventoryItems.filter((i) => i.status === 'in-stock').length,
      icon: '✓',
    },
    {
      label: 'Low Stock',
      value: inventoryItems.filter((i) => i.status === 'low-stock').length,
      icon: '⚠️',
    },
    {
      label: 'Out of Stock',
      value: inventoryItems.filter((i) => i.status === 'out-of-stock').length,
      icon: '✕',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="mt-1 text-muted-foreground">Monitor stock levels and product availability</p>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="mt-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="mt-8 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Category</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Available</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Reserved</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Sold (Total)</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Last Updated</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{item.productName}</td>
                  <td className="px-4 py-3 text-foreground">{item.category}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {item.available} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">{item.reserved} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-foreground">{item.sold} {item.unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.status === 'low-stock' && (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {item.lastUpdated.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="inline-flex rounded-lg p-2 hover:bg-secondary" aria-label="Edit">
                      <Edit2 className="h-4 w-4 text-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <p>No products found in inventory</p>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        {inventoryItems.some((i) => i.status === 'low-stock' || i.status === 'out-of-stock') && (
          <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">Stock Alert</h3>
                <p className="mt-1 text-sm text-yellow-800">
                  {inventoryItems.filter((i) => i.status === 'low-stock' || i.status === 'out-of-stock')
                    .length}{' '}
                  product(s) have low or no stock. Consider restocking soon.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
