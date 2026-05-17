'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { productService } from '@/lib/product-service'
import { Product } from '@/lib/types'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { Suspense } from 'react'

function ProductManagementContent() {
  const { user, token } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter') // 'active' | 'low' | 'out' | null

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    if (user && user.role !== 'farmer') { router.replace('/dashboard'); return }
  }, [user, router])

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await productService.getProducts(token || undefined)
      // Only show this farmer's products
      setProducts(data)
    } catch {
      setError('Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadProducts() }, [loadProducts])

  const handleDelete = async (id: number) => {
    if (!token || !confirm('Delete this product?')) return
    try {
      await productService.deleteProduct(id, token)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch {
      alert('Failed to delete product.')
    }
  }

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  const stats = {
    total: products.length,
    active: products.filter(p => p.available_quantity > 0).length,
    lowStock: products.filter(p => p.available_quantity > 0 && p.available_quantity < 20).length,
    outOfStock: products.filter(p => p.available_quantity === 0).length,
  }

  // Apply quick filter from URL param
  const applyQuickFilter = (p: Product) => {
    if (filterParam === 'active') return p.available_quantity > 0
    if (filterParam === 'low') return p.available_quantity > 0 && p.available_quantity < 20
    if (filterParam === 'out') return p.available_quantity === 0
    return true
  }

  const filtered = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCat = filterCategory === 'all' || p.category === filterCategory
      return matchSearch && matchCat && applyQuickFilter(p)
    })
    .sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price
      if (sortBy === 'stock') return b.available_quantity - a.available_quantity
      return a.name.localeCompare(b.name)
    })

  const statCards = [
    { label: 'Total Products', value: stats.total, color: 'text-primary', filter: null, bg: filterParam === null ? 'ring-2 ring-primary' : '' },
    { label: 'Active', value: stats.active, color: 'text-green-600', filter: 'active', bg: filterParam === 'active' ? 'ring-2 ring-green-500' : '' },
    { label: 'Low Stock', value: stats.lowStock, color: 'text-orange-600', filter: 'low', bg: filterParam === 'low' ? 'ring-2 ring-orange-500' : '' },
    { label: 'Out of Stock', value: stats.outOfStock, color: 'text-destructive', filter: 'out', bg: filterParam === 'out' ? 'ring-2 ring-destructive' : '' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and monitor your product inventory</p>
          </div>
          <Link href="/products/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Clickable stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(s => (
            <button
              key={s.label}
              onClick={() => router.push(s.filter ? `/products/manage?filter=${s.filter}` : '/products/manage')}
              className={`bg-card rounded-lg border border-border p-6 text-left hover:shadow-md transition-all ${s.bg}`}
            >
              <p className="text-muted-foreground text-sm mb-2">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{loading ? '...' : s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">Click to filter</p>
            </button>
          ))}
        </div>

        {/* Active filter badge */}
        {filterParam && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary capitalize">
              {filterParam === 'out' ? 'Out of Stock' : filterParam === 'low' ? 'Low Stock' : filterParam}
              <button onClick={() => router.push('/products/manage')} className="ml-1 hover:text-primary/70">×</button>
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground outline-none">
              {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground outline-none">
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="stock">Sort by Stock</option>
            </select>
          </div>
          <p className="text-sm text-muted-foreground mt-3">Showing {filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadProducts}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Plus} title="No products found"
            description={searchTerm ? 'Try a different search term.' : filterParam ? 'No products match this filter.' : 'Add your first product to get started.'}
            actionLabel="Add Product" actionHref="/products/new" />
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Location</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(product => (
                    <tr key={product.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{product.category}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{product.price.toLocaleString()} ETB/{product.unit}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${product.available_quantity === 0 ? 'text-destructive' : product.available_quantity < 20 ? 'text-orange-600' : 'text-green-600'}`}>
                            {product.available_quantity}
                          </span>
                          {product.available_quantity === 0 && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">Out</span>}
                          {product.available_quantity > 0 && product.available_quantity < 20 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Low</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{product.location}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/product/${product.id}`}>
                            <button className="p-2 hover:bg-secondary rounded transition-colors" title="View"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                          </Link>
                          <Link href={`/products/${product.id}/edit`}>
                            <button className="p-2 hover:bg-secondary rounded transition-colors" title="Edit"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                          </Link>
                          <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-destructive/10 rounded transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductManagementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" /></div>}>
      <ProductManagementContent />
    </Suspense>
  )
}
