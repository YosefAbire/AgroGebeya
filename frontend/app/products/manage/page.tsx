'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, Eye, MoreVertical, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: 'active' | 'inactive'
  image: string
  rating: number
  sales: number
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Organic Tomatoes',
    category: 'Vegetables',
    price: 450,
    stock: 150,
    status: 'active',
    image: '/products/tomato.jpg',
    rating: 4.8,
    sales: 342,
  },
  {
    id: '2',
    name: 'Fresh Lettuce',
    category: 'Vegetables',
    price: 280,
    stock: 80,
    status: 'active',
    image: '/products/lettuce.jpg',
    rating: 4.6,
    sales: 198,
  },
  {
    id: '3',
    name: 'White Onions',
    category: 'Vegetables',
    price: 320,
    stock: 0,
    status: 'inactive',
    image: '/products/onions.jpg',
    rating: 4.5,
    sales: 156,
  },
  {
    id: '4',
    name: 'Wheat Grain',
    category: 'Grains',
    price: 1200,
    stock: 500,
    status: 'active',
    image: '/products/wheat.jpg',
    rating: 4.7,
    sales: 287,
  },
  {
    id: '5',
    name: 'Red Bell Peppers',
    category: 'Vegetables',
    price: 600,
    stock: 45,
    status: 'active',
    image: '/products/peppers.jpg',
    rating: 4.9,
    sales: 425,
  },
]

const Loading = () => null

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  const categories = ['all', 'Vegetables', 'Grains', 'Fruits', 'Herbs']

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || p.category === filterCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price
        case 'stock':
          return b.stock - a.stock
        case 'sales':
          return b.sales - a.sales
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id))
  }

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => p.stock < 50 && p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and monitor your product inventory</p>
          </div>
          <Link href="/products/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-muted-foreground text-sm mb-2">Total Products</p>
            <p className="text-3xl font-bold text-primary">{stats.totalProducts}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-muted-foreground text-sm mb-2">Active</p>
            <p className="text-3xl font-bold text-green-600">{stats.activeProducts}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-muted-foreground text-sm mb-2">Low Stock</p>
            <p className="text-3xl font-bold text-orange-600">{stats.lowStock}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-muted-foreground text-sm mb-2">Out of Stock</p>
            <p className="text-3xl font-bold text-destructive">{stats.outOfStock}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-card rounded-lg border border-border p-6 mb-8">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search products by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border focus:border-primary"
                />
              </div>

              {/* Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground focus:border-primary outline-none transition-colors"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground focus:border-primary outline-none transition-colors"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="stock">Sort by Stock</option>
                <option value="sales">Sort by Sales</option>
              </select>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Sales</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rating</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{product.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">{product.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">ETB {product.price.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          product.stock === 0 ? 'text-destructive' : product.stock < 50 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {product.stock}
                        </span>
                        {product.stock === 0 && <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">Out</span>}
                        {product.stock > 0 && product.stock < 50 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Low</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground">{product.sales}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-foreground">{product.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1.5 rounded ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-secondary rounded transition-colors" title="View">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <Link href={`/products/${product.id}/edit`}>
                          <button className="p-2 hover:bg-secondary rounded transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-destructive/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No products found</p>
              <Link href="/products/new">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Product
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const unstable_settings = {
  suspense: true,
}
