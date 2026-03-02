'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useParams } from 'next/navigation'

export default function EditProductPage() {
  const params = useParams()
  const productId = params.id as string
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: 'Organic Tomatoes',
    description: 'Fresh, organic tomatoes grown without pesticides. Perfect for salads and cooking.',
    category: 'Vegetables',
    price: 450,
    unit: 'kg',
    stock: 150,
    minimumStock: 20,
    status: 'active',
    image: '/products/tomato.jpg',
    certification: 'Organic Certified',
    origin: 'Addis Ababa',
    harvest: '2024-01-15',
    expiryDays: 14,
    tags: ['organic', 'fresh', 'local'],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' || name === 'minimumStock' || name === 'expiryDays'
        ? Number(value)
        : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/products/manage" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Edit Product</h1>
            <p className="text-muted-foreground">Update product information and details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>
              <div className="space-y-4">
                {/* Product Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-foreground">
                    Product Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-secondary/50 border-border focus:border-primary"
                    disabled={isSaving}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-foreground">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground focus:border-primary outline-none transition-colors resize-none"
                    disabled={isSaving}
                  />
                </div>

                {/* Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="category" className="block text-sm font-medium text-foreground">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground focus:border-primary outline-none transition-colors"
                      disabled={isSaving}
                    >
                      <option value="Vegetables">Vegetables</option>
                      <option value="Grains">Grains</option>
                      <option value="Fruits">Fruits</option>
                      <option value="Herbs">Herbs</option>
                      <option value="Dairy">Dairy</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="origin" className="block text-sm font-medium text-foreground">
                      Origin
                    </label>
                    <Input
                      id="origin"
                      name="origin"
                      value={formData.origin}
                      onChange={handleChange}
                      className="bg-secondary/50 border-border focus:border-primary"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Pricing & Inventory</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div className="space-y-2">
                    <label htmlFor="price" className="block text-sm font-medium text-foreground">
                      Price (ETB)
                    </label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      className="bg-secondary/50 border-border focus:border-primary"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Unit */}
                  <div className="space-y-2">
                    <label htmlFor="unit" className="block text-sm font-medium text-foreground">
                      Unit
                    </label>
                    <Input
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      placeholder="kg, liters, etc."
                      className="bg-secondary/50 border-border focus:border-primary"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Stock */}
                  <div className="space-y-2">
                    <label htmlFor="stock" className="block text-sm font-medium text-foreground">
                      Current Stock
                    </label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      value={formData.stock}
                      onChange={handleChange}
                      className="bg-secondary/50 border-border focus:border-primary"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Minimum Stock */}
                  <div className="space-y-2">
                    <label htmlFor="minimumStock" className="block text-sm font-medium text-foreground">
                      Minimum Stock Alert
                    </label>
                    <Input
                      id="minimumStock"
                      name="minimumStock"
                      type="number"
                      value={formData.minimumStock}
                      onChange={handleChange}
                      className="bg-secondary/50 border-border focus:border-primary"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Product Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Certification */}
                  <div className="space-y-2">
                    <label htmlFor="certification" className="block text-sm font-medium text-foreground">
                      Certification
                    </label>
                    <Input
                      id="certification"
                      name="certification"
                      value={formData.certification}
                      onChange={handleChange}
                      placeholder="e.g., Organic Certified"
                      className="bg-secondary/50 border-border focus:border-primary"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Harvest Date */}
                  <div className="space-y-2">
                    <label htmlFor="harvest" className="block text-sm font-medium text-foreground">
                      Harvest Date
                    </label>
                    <Input
                      id="harvest"
                      name="harvest"
                      type="date"
                      value={formData.harvest}
                      onChange={handleChange}
                      className="bg-secondary/50 border-border focus:border-primary"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Expiry Days */}
                <div className="space-y-2">
                  <label htmlFor="expiryDays" className="block text-sm font-medium text-foreground">
                    Shelf Life (Days)
                  </label>
                  <Input
                    id="expiryDays"
                    name="expiryDays"
                    type="number"
                    value={formData.expiryDays}
                    onChange={handleChange}
                    className="bg-secondary/50 border-border focus:border-primary"
                    disabled={isSaving}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label htmlFor="status" className="block text-sm font-medium text-foreground">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground focus:border-primary outline-none transition-colors"
                    disabled={isSaving}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Image */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Product Image</h2>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-lg bg-secondary/30 flex items-center justify-center flex-shrink-0">
                  <img src={formData.image || "/placeholder.svg"} alt={formData.name} className="w-full h-full object-cover rounded-lg" />
                </div>
                <div className="flex-1">
                  <Button type="button" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                    <Upload className="w-4 h-4" />
                    Upload New Image
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG or WebP. Max size 5MB. Recommended 600x600px
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="bg-green-50 border border-green-200 rounded text-green-700 text-sm p-4 flex items-center justify-between">
                <span>Product updated successfully!</span>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="text-green-700 hover:text-green-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href="/products/manage">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
