'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, ShoppingCart, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { dashboardService } from '@/lib/services/dashboard-service'
import { productService } from '@/lib/product-service'
import { Product } from '@/lib/types'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'

export default function ProductAnalyticsPage() {
  const { token } = useAuth()
  const [timeRange, setTimeRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<{ total_products?: number; total_earnings?: number; pending_orders?: number } | null>(null)

  const loadData = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const [prods, farmerStats] = await Promise.all([
        productService.getProducts(token),
        dashboardService.getFarmerStats(token),
      ])
      setProducts(prods)
      setStats(farmerStats)
    } catch {
      setError('Failed to load analytics data.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadData() }, [loadData])

  const totalStock = products.reduce((sum, p) => sum + p.available_quantity, 0)
  const outOfStock = products.filter(p => p.available_quantity === 0).length
  const categories = Array.from(new Set(products.map(p => p.category)))

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Product Analytics</h1>
            <p className="text-muted-foreground">Track your product performance and inventory</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 rounded-md bg-card border border-border text-foreground outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>

        {loading ? (
          <>
            <LoadingSkeleton type="stats" count={4} />
            <LoadingSkeleton type="table" count={5} />
          </>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadData}>Retry</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border border-border p-6">
                <p className="text-muted-foreground text-sm mb-2">Total Products</p>
                <p className="text-3xl font-bold text-primary">{stats?.total_products ?? products.length}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-6">
                <p className="text-muted-foreground text-sm mb-2">Total Stock</p>
                <p className="text-3xl font-bold text-primary">{totalStock.toLocaleString()}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-6">
                <p className="text-muted-foreground text-sm mb-2">Out of Stock</p>
                <p className={`text-3xl font-bold ${outOfStock > 0 ? 'text-destructive' : 'text-green-600'}`}>{outOfStock}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-6">
                <p className="text-muted-foreground text-sm mb-2">Pending Orders</p>
                <p className="text-3xl font-bold text-primary">{stats?.pending_orders ?? 0}</p>
              </div>
            </div>

            {products.length === 0 ? (
              <EmptyState icon={Package} title="No products yet" description="Add products to see analytics." actionLabel="Add Product" actionHref="/products/new" />
            ) : (
              <>
                <div className="bg-card rounded-lg border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-6">Product Inventory</h2>
                  <div className="space-y-3">
                    {products.slice(0, 10).map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{p.name}</p>
                          <p className="text-sm text-muted-foreground">{p.category} • {p.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">ETB {p.price.toLocaleString()}/{p.unit}</p>
                          <p className={`text-sm ${p.available_quantity === 0 ? 'text-destructive' : p.available_quantity < 20 ? 'text-orange-600' : 'text-green-600'}`}>
                            {p.available_quantity} in stock
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-6">By Category</h2>
                  <div className="space-y-4">
                    {categories.map(cat => {
                      const catProducts = products.filter(p => p.category === cat)
                      const pct = Math.round((catProducts.length / products.length) * 100)
                      return (
                        <div key={cat} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{cat}</p>
                            <p className="text-sm text-muted-foreground">{catProducts.length} products</p>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-primary to-accent h-full" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground">{pct}% of total</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
