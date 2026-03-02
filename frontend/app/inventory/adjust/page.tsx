'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Header from '@/components/Header'
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type AdjustmentType = 'restock' | 'damage' | 'loss' | 'return'

export default function InventoryAdjustmentPage() {
  const [products, setProducts] = useState([
    { id: '1', name: 'Teff Flour', currentQuantity: 150 },
    { id: '2', name: 'Wheat', currentQuantity: 45 },
    { id: '3', name: 'Barley', currentQuantity: 650 },
    { id: '4', name: 'Maize', currentQuantity: 280 },
    { id: '5', name: 'Fertilizer NPK', currentQuantity: 30 },
  ])

  const [selectedProduct, setSelectedProduct] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('restock')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !quantity) return
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setSelectedProduct('')
      setQuantity('')
      setReason('')
    }, 3000)
  }

  const typeLabels: Record<AdjustmentType, string> = {
    restock: 'Add Stock',
    damage: 'Damaged/Defective',
    loss: 'Lost/Missing',
    return: 'Customer Return',
  }

  const typeDescriptions: Record<AdjustmentType, string> = {
    restock: 'New stock arrival or transfer',
    damage: 'Items damaged or unsuitable for sale',
    loss: 'Items lost, stolen, or unaccounted',
    return: 'Items returned by customers',
  }

  const selectedProductData = products.find(p => p.id === selectedProduct)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/inventory/overview">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Adjust Inventory</h1>
            <p className="text-muted-foreground">Update stock levels for products</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stock Adjustment Form</CardTitle>
            <CardDescription>Record inventory changes due to restocking, damage, loss, or returns</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted && (
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex gap-3 mb-6">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Adjustment recorded successfully!</p>
                  <p className="text-sm text-green-800 dark:text-green-200">The inventory has been updated.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Selection */}
              <div>
                <Label htmlFor="product">Product</Label>
                <select
                  id="product"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mt-2"
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Current: {product.currentQuantity} kg)
                    </option>
                  ))}
                </select>
                {selectedProductData && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Current stock: {selectedProductData.currentQuantity} kg
                  </p>
                )}
              </div>

              {/* Adjustment Type */}
              <div>
                <Label>Adjustment Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {(Object.entries(typeLabels) as Array<[AdjustmentType, string]>).map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAdjustmentType(type)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        adjustmentType === type
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      <p className="font-medium text-foreground text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{typeDescriptions[type]}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="quantity">Quantity ({adjustmentType === 'restock' ? 'to add' : 'to remove'})</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="1"
                  required
                  className="mt-2"
                />
              </div>

              {/* Reason/Notes */}
              <div>
                <Label htmlFor="reason">Reason / Notes</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide details about this adjustment..."
                  className="mt-2 resize-none"
                  rows={4}
                />
              </div>

              {/* Preview */}
              {selectedProductData && quantity && (
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="text-sm font-medium text-foreground mb-3">Adjustment Preview:</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-foreground">Current stock:</span>
                      <span className="font-medium text-foreground">{selectedProductData.currentQuantity} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground">
                        {adjustmentType === 'restock' ? 'Adding:' : 'Removing:'}
                      </span>
                      <span
                        className={`font-medium ${adjustmentType === 'restock' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {adjustmentType === 'restock' ? '+' : '-'}
                        {quantity} kg
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between">
                      <span className="font-medium text-foreground">New stock:</span>
                      <span className="font-bold text-foreground text-lg">
                        {adjustmentType === 'restock'
                          ? selectedProductData.currentQuantity + parseInt(quantity || '0')
                          : selectedProductData.currentQuantity - parseInt(quantity || '0')}{' '}
                        kg
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-11">
                Record Adjustment
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
