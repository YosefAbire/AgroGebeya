'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import MultipleImageUpload from '@/components/MultipleImageUpload'
import { uploadService } from '@/lib/services/upload-service'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface ImageItem {
  id?: number
  url: string
  isPrimary: boolean
}

export default function NewProductPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [images, setImages] = useState<ImageItem[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    unit: 'KG',
    available_quantity: '',
    location: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check auth but don't redirect immediately - show message instead
  useEffect(() => {
    // Don't check while still loading auth state
    if (loading) return
    
    if (!user) {
      setError('Please login to create products')
    } else if (user.role !== 'farmer') {
      setError('Only farmers can create products')
    }
  }, [user, loading])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageUpload = async (file: File, isPrimary: boolean) => {
    // For new products, store images temporarily until product is created
    const reader = new FileReader()
    reader.onloadend = () => {
      setImages(prev => [
        ...prev,
        {
          url: reader.result as string,
          isPrimary: isPrimary || prev.length === 0,
          file,
        } as any
      ])
    }
    reader.readAsDataURL(file)
  }

  const handleImageRemove = async (imageId: number, url: string) => {
    setImages(prev => prev.filter((_, index) => index !== imageId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Check if user is logged in
      if (!token) {
        throw new Error('Please login first to create products')
      }

      // Validate form
      if (!formData.name || !formData.category || !formData.price || !formData.available_quantity) {
        throw new Error('Please fill in all required fields')
      }

      // Create product first
      const response = await fetch('http://127.0.0.1:8000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          available_quantity: parseInt(formData.available_quantity),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to create product')
      }

      const product = await response.json()

      // Upload images
      for (let i = 0; i < images.length; i++) {
        const image = images[i] as any
        if (image.file && token) {
          await uploadService.uploadProductImage(
            product.id,
            image.file,
            image.isPrimary,
            token
          )
        }
      }

      // Redirect to product page or products list
      toast.success('Product created successfully!')
      router.push('/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Add New Product</h1>
          <p className="mt-1 text-muted-foreground">
            List your agricultural products for retailers to purchase
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Product Images */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Product Images</h2>
            <MultipleImageUpload
              images={images}
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              maxImages={5}
              maxSize={5}
            />
          </div>

          {/* Basic Information */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Fresh Tomatoes"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe your product..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select category</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="grains">Grains</option>
                  <option value="dairy">Dairy</option>
                  <option value="livestock">Livestock</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Addis Ababa"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Pricing & Inventory</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-foreground mb-1">
                  Price (ETB) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-foreground mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="KG">Kilogram (KG)</option>
                  <option value="QUINTAL">Quintal</option>
                  <option value="PIECE">Piece</option>
                  <option value="LITER">Liter</option>
                  <option value="BAG">Bag</option>
                </select>
              </div>

              <div>
                <label htmlFor="available_quantity" className="block text-sm font-medium text-foreground mb-1">
                  Available Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="available_quantity"
                  name="available_quantity"
                  value={formData.available_quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              {!user && (
                <Link
                  href="/auth/login"
                  className="mt-2 inline-block text-sm font-semibold text-primary hover:text-primary/90"
                >
                  Go to Login →
                </Link>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
