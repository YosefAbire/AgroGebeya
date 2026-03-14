'use client'

import { Search, Plus, SlidersHorizontal } from 'lucide-react'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'
import { productService } from '@/lib/product-service'
import { Product } from '@/lib/types'
import { useAuthContext } from '@/components/AuthProvider'
import { locationService } from '@/lib/services/location-service'

export default function ProductsPage() {
  const { token } = useAuthContext()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [cities, setCities] = useState<string[]>([])

  const categories = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Beverages']

  useEffect(() => {
    loadProducts()
    locationService.getCities().then(setCities).catch(() => {})
  }, [])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const data = await productService.getProducts(token || undefined)
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort products
  let filteredProducts = [...products]

  if (selectedCategory !== 'all') {
    filteredProducts = filteredProducts.filter((p) =>
      p.category.toLowerCase() === selectedCategory.toLowerCase()
    )
  }

  if (selectedLocation) {
    filteredProducts = filteredProducts.filter((p) =>
      p.location?.toLowerCase().includes(selectedLocation.toLowerCase())
    )
  }

  if (searchQuery) {
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  // Sort products (create new array to trigger re-render)
  if (sortBy === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price)
  } else if (sortBy === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price)
  } else if (sortBy === 'availability') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.available_quantity - a.available_quantity)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products Marketplace</h1>
            <p className="mt-1 text-muted-foreground">Browse all available agricultural products</p>
          </div>
          <Link
            href="/products/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            List Product
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="mt-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product name, category, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category and Sort */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category.toLowerCase())}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === category.toLowerCase()
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-card text-foreground hover:bg-secondary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Locations</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="availability">Most Available</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mt-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-muted-foreground">Loading products...</p>
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                // Get the primary image or first image from the images array
                let imageUrl: string | undefined;
                
                try {
                  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                    const primaryImage = product.images.find(img => img?.is_primary && img?.image_url);
                    const firstImage = product.images.find(img => img?.image_url);
                    const selectedImage = primaryImage || firstImage;
                    
                    if (selectedImage?.image_url && typeof selectedImage.image_url === 'string' && selectedImage.image_url.trim()) {
                      imageUrl = selectedImage.image_url;
                    }
                  }
                  
                  // Fallback to product.image_url if no images array
                  if (!imageUrl && product.image_url && typeof product.image_url === 'string' && product.image_url.trim()) {
                    imageUrl = product.image_url;
                  }
                } catch (error) {
                  console.error('Error processing product image:', error);
                  imageUrl = undefined;
                }
                
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id.toString()}
                    name={product.name}
                    category={product.category}
                    price={product.price}
                    unit={product.unit}
                    available={product.available_quantity}
                    location={product.location || 'N/A'}
                    image={imageUrl}
                    farmer={`Farmer #${product.farmer_id}`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card py-16 text-center">
              <div className="text-5xl">🔍</div>
              <h3 className="text-xl font-semibold text-foreground">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters or browse other categories</p>
            </div>
          )}
        </div>

        {/* Results Counter */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </main>
    </div>
  )
}
