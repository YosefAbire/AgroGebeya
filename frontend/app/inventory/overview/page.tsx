'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Header from '@/components/Header'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuthContext } from '@/components/AuthProvider'
import { inventoryService, InventoryItem as ServiceInventoryItem, InventoryStats } from '@/lib/services/inventory-service'

interface InventoryItem extends ServiceInventoryItem {
  status: 'low' | 'optimal' | 'overstock'
}

export default function InventoryOverviewPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<InventoryStats | null>(null)

  const { token } = useAuthContext()

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [itemsData, statsData] = await Promise.all([
          inventoryService.getInventory(token),
          inventoryService.getStats(token)
        ]);

        if (!isMounted) return;

        // Map backend data to local structure with status
        const itemsWithStatus = itemsData.map(item => {
          let status: InventoryItem['status'] = 'optimal';
          const minThreshold = item.low_stock_threshold || 10;
          // Approximate a max threshold or overstock just for UI flair if no explicit backend support
          const maxThreshold = minThreshold * 5;

          if (item.available_quantity <= minThreshold) {
            status = 'low';
          } else if (item.available_quantity >= maxThreshold) {
            status = 'overstock';
          }

          return {
            ...item,
            status
          };
        });

        setInventoryItems(itemsWithStatus);
        setStats(statsData);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to load inventory overview:', err);
        setError(err.message || 'Failed to load inventory data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [token]);

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

  const filteredInventory = inventoryItems.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate local stats explicitly based on mapped status if we want to show exact 'overstock' counts 
  // since the backend stats might only have low stock / out of stock
  const displayStats = {
    totalItems: stats?.total_products || 0,
    lowStockCount: inventoryItems.filter(item => item.status === 'low').length,
    overstockCount: inventoryItems.filter(item => item.status === 'overstock').length,
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        <div className={`transition-all duration-500 ${loading ? 'opacity-50 pointer-events-none blur-[1px]' : 'opacity-100 blur-0'}`}>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">Total Products</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-foreground transition-all duration-500">{displayStats.totalItems}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">In your catalog</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">Low Stock Alerts</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-red-600 transition-all duration-500">{displayStats.lowStockCount}</p>
                  <AlertTriangle className="h-6 w-6 text-red-600 opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Need immediate restocking</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">Overstock Items</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-yellow-600 transition-all duration-500">{displayStats.overstockCount}</p>
                  <TrendingUp className="h-6 w-6 text-yellow-600 opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Above normal thresholds</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 transition-colors focus-visible:ring-primary"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="low">Low Stock</option>
              <option value="optimal">Optimal</option>
              <option value="overstock">Overstock</option>
            </select>
            <Link href="/inventory/adjust">
              <Button variant="outline" className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground group transition-all">
                Adjust Stock
              </Button>
            </Link>
          </div>

          {/* Inventory Table */}
          <Card className="shadow-sm">
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
                      <th className="text-left py-3 px-4 font-medium text-foreground">Last Restocked</th>
                      <th className="text-right py-3 px-4 font-medium text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="relative">
                    {loading && inventoryItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse">Loading overview...</p>
                          </div>
                        </td>
                      </tr>
                    )}

                    {!loading && filteredInventory.length === 0 && !error && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="text-3xl mb-2">📊</div>
                            <p className="text-lg font-medium text-foreground">No records match your filters</p>
                          </div>
                        </td>
                      </tr>
                    )}

                    {filteredInventory.map(item => {
                      const statusInfo = getStatusColor(item.status)
                      const StatusIcon = statusInfo.icon
                      const minThreshold = item.low_stock_threshold || 10;

                      return (
                        <tr key={item.id} className="border-b border-border hover:bg-secondary/70 transition-colors duration-200">
                          <td className="py-4 px-4">
                            <p className="font-medium text-foreground">{item.product_name}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-foreground font-semibold">
                              {item.available_quantity} {item.unit}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Alert below: {minThreshold}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${statusInfo.bg}`}>
                              <StatusIcon className={`h-4 w-4 ${item.status === 'low' ? 'animate-pulse' : ''}`} />
                              <span className={`text-sm font-medium capitalize ${statusInfo.text}`}>
                                {item.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-foreground text-sm whitespace-nowrap">
                              {item.last_updated ? new Date(item.last_updated).toLocaleString() : 'Never'}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Link href={`/inventory/items/${item.id}`}>
                              <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors">
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
        </div>
      </main>
    </div>
  )
}
