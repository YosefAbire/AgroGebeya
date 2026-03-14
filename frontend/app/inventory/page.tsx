'use client'

import { AlertCircle, Edit2, Search, TrendingDown, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useSearchParams } from 'next/navigation'
import { inventoryService, InventoryItem as ServiceInventoryItem } from '@/lib/services/inventory-service'
import { useAuthContext } from '@/components/AuthProvider'

interface InventoryItem extends ServiceInventoryItem {
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token, isLoading: authLoading } = useAuthContext()

  useEffect(() => {
    // If auth context is still figuring out if we have a token, just wait
    if (authLoading) return;

    let isMounted = true;

    // If auth finished loading and there's no token, stop loading the inventory
    if (!token) {
      setLoading(false);
      setError("Please log in to view your inventory.");
      return;
    }

    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await inventoryService.getInventory(token);

        if (!isMounted) return;

        // Map backend data to local structure with status
        const itemsWithStatus = data.map(item => {
          let status: InventoryItem['status'] = 'in-stock';
          const threshold = item.low_stock_threshold || 10;

          if (item.available_quantity === 0) {
            status = 'out-of-stock';
          } else if (item.available_quantity <= threshold) {
            status = 'low-stock';
          }

          return {
            ...item,
            status
          };
        });

        setInventoryItems(itemsWithStatus);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to load inventory:', err);
        setError(err.message || 'Failed to load inventory');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInventory();

    return () => {
      isMounted = false;
    };
  }, [token, authLoading]);

  // Filter inventory
  const filteredItems = inventoryItems.filter(
    (item) =>
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item as any).category?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="mt-1 text-muted-foreground">Monitor stock levels and product availability</p>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        <div className={`transition-all duration-500 ${loading ? 'opacity-50 pointer-events-none blur-[1px]' : 'opacity-100 blur-0'}`}>
          {/* Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold text-foreground transition-all duration-500">{stat.value}</p>
                  </div>
                  <span className="text-3xl transition-transform duration-300 hover:scale-110">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="mt-8">
            <div className="relative group">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Search by product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
              />
            </div>
          </div>

          {/* Inventory Table */}
          <div className="mt-8 overflow-hidden rounded-lg border border-border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm relative">
                <thead className="border-b border-border bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Product</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Available</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Reserved</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Last Updated</th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="relative">
                  {loading && inventoryItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-muted-foreground animate-pulse">Loading inventory data...</p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading && filteredItems.length === 0 && !error && (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="text-4xl mb-2">📦</div>
                          <p className="text-lg font-medium text-foreground">No products found</p>
                          <p>Try adjusting your search</p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-secondary/70 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{item.product_name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        {item.available_quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {item.reserved_quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.status === 'low-stock' && (
                            <AlertCircle className="h-4 w-4 text-yellow-600 animate-pulse" />
                          )}
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-medium transition-colors ${getStatusBadge(
                              item.status
                            )}`}
                          >
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">
                        {item.last_updated ? new Date(item.last_updated).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="inline-flex rounded-lg p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors focus:ring-2 focus:ring-primary focus:outline-none group" aria-label="Edit">
                          <Edit2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Alert */}
          {inventoryItems.some((i) => i.status === 'low-stock' || i.status === 'out-of-stock') && (
            <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Stock Alert</h3>
                  <p className="mt-1 text-sm text-yellow-800">
                    <span className="font-bold">
                      {inventoryItems.filter((i) => i.status === 'low-stock' || i.status === 'out-of-stock').length}
                    </span>{' '}
                    product(s) have low or no stock. Consider restocking soon.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

