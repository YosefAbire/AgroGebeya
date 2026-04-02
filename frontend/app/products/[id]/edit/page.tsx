'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { productService } from '@/lib/product-service'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { toast } from 'sonner'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuth()
  const productId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Vegetables',
    price: 0,
    unit: 'kg',
    available_quantity: 0,
    location: '',
  })

  const loadProduct = useCallback(async () => {
    if (user && user.role !== 'farmer') { router.replace('/dashboard'); return }
    try {
      setLoading(true)
      const product = await productService.getProduct(productId, token || undefined)
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        price: product.price,
        unit: product.unit,
        available_quantity: product.available_quantity,
        location: product.location,
      })
    } catch {
      setError('Failed to load product.')
    } finally {
      setLoading(false)
    }
  }, [productId, token])

  useEffect(() => { loadProduct() }, [loadProduct])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'available_quantity' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!formData.name.trim()) { setError('Product name is required'); return }
    if (!formData.price || formData.price <= 0) { setError('A valid price is required'); return }
    setIsSaving(true)
    try {
      await productService.updateProduct(productId, formData, token)
      toast.success('Product updated successfully!')
      setTimeout(() => router.push('/products/manage'), 1000)
    } catch {
      setError('Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background max-w-4xl mx-auto px-4 py-8">
        <LoadingSkeleton type="form" count={6} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/products/manage" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Product</h1>
          <p className="text-muted-foreground">Update product information and details</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Product Name</label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} disabled={isSaving} required />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea
                id="description" name="description" value={formData.description} onChange={handleChange}
                rows={4} disabled={isSaving}
                className="w-full px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground focus:border-primary outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">Category</label>
                <select
                  id="category" name="category" value={formData.category} onChange={handleChange} disabled={isSaving}
                  className="w-full px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground focus:border-primary outline-none"
                >
                  <option value="Vegetables">Vegetables</option>
                  <option value="Grains">Grains</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Herbs">Herbs</option>
                  <option value="Dairy">Dairy</option>
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">Location</label>
                <Input id="location" name="location" value={formData.location} onChange={handleChange} disabled={isSaving} />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Pricing and Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-foreground mb-1">Price (Birr)</label>
                <Input id="price" name="price" type="number" min="0" value={formData.price} onChange={handleChange} disabled={isSaving} required />
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-foreground mb-1">Unit</label>
                <Input id="unit" name="unit" value={formData.unit} onChange={handleChange} placeholder="kg, liters, etc." disabled={isSaving} />
              </div>
            </div>
            <div>
              <label htmlFor="available_quantity" className="block text-sm font-medium text-foreground mb-1">Available Quantity</label>
              <Input id="available_quantity" name="available_quantity" type="number" min="0" value={formData.available_quantity} onChange={handleChange} disabled={isSaving} />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm p-3">{error}</div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href="/products/manage">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
