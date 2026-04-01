'use client'

import React from "react"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Header from '@/components/Header'
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuthContext } from '@/components/AuthProvider'
import { inventoryService, InventoryItem } from '@/lib/services/inventory-service'

type AdjustmentType = 'restock' | 'damage' | 'loss' | 'return'

export default function InventoryAdjustmentPage() {
  const [products, setProducts] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedProduct, setSelectedProduct] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('restock')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { token } = useAuthContext()

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await inventoryService.getInventory(token);
        if (isMounted) {
          setProducts(data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to load products for adjustment:', err);
          setError(err.message || 'Failed to load products');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !quantity || !token) { setError('Please select a product and enter a quantity.'); return }

    try {
      setSubmitting(true)
      setError(null)

      const qtyNum = parseInt(quantity, 10);
      const isNegative = adjustmentType !== 'restock' && adjustmentType !== 'return';
      const quantityChange = isNegative ? -qtyNum : qtyNum;

      const updatedItem = await inventoryService.adjustInventory(
        parseInt(selectedProduct, 10),
        {
          product_id: parseInt(selectedProduct, 10),
          quantity_change: quantityChange,
          reason: typeLabels[adjustmentType],
          notes: reason
        },
        token
      );

      // Update local state with the new quantity
      setProducts(prev => prev.map(p => p.product_id === updatedItem.product_id ? updatedItem : p));

      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setSelectedProduct('')
        setQuantity('')
        setReason('')
        setAdjustmentType('restock')
      }, 3000)
    } catch (err: any) {
      console.error('Adjustment failed:', err);
      setError(err.message || 'Failed to submit adjustment');
    } finally {
      setSubmitting(false)
    }
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

  const selectedProductData = products.find(p => p.product_id.toString() === selectedProduct)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/inventory/overview">
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Adjust Inventory</h1>
            <p className="text-muted-foreground mt-1">Update stock levels for your products</p>
          </div>
        </div>

        <div className={`transition-all duration-500 ${loading ? 'opacity-50 pointer-events-none blur-[1px]' : 'opacity-100 blur-0'}`}>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Stock Adjustment Form</CardTitle>
              <CardDescription>Record inventory changes due to restocking, damage, loss, or returns</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 mb-6 animate-in slide-in-from-top-2 fade-in">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {submitted && (
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex gap-3 mb-6 animate-in slide-in-from-top-2 fade-in">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Adjustment recorded successfully!</p>
                    <p className="text-sm text-green-800 dark:text-green-200">The inventory has been updated.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* Product Selection */}
                <div>
                  <Label htmlFor="product">Select Product</Label>
                  <div className="relative mt-2">
                    <select
                      id="product"
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-input rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none transition-shadow"
                      disabled={loading || submitting}
                    >
                      <option value="">{loading ? 'Loading catalog...' : 'Choose a product from your catalog'}</option>
                      {products.map(product => (
                        <option key={product.product_id} value={product.product_id}>
                          {product.product_name} (Current: {product.available_quantity} {product.unit})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                      <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                  {selectedProductData && (
                    <p className="text-sm text-muted-foreground mt-2 animate-in fade-in">
                      Current stock level: <span className="font-semibold text-foreground">{selectedProductData.available_quantity} {selectedProductData.unit}</span>
                    </p>
                  )}
                </div>

                {/* Adjustment Type */}
                <div className="animate-in fade-in fill-mode-both delay-75">
                  <Label>Adjustment Reason</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {(Object.entries(typeLabels) as Array<[AdjustmentType, string]>).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAdjustmentType(type)}
                        className={`p-4 border rounded-xl text-left transition-all duration-200 hover:shadow-sm ${adjustmentType === type
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border hover:border-primary/50 bg-card'
                          }`}
                        disabled={submitting}
                      >
                        <p className={`font-medium text-sm transition-colors ${adjustmentType === type ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{typeDescriptions[type]}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="animate-in fade-in fill-mode-both delay-150">
                  <Label htmlFor="quantity">Quantity ({adjustmentType === 'restock' || adjustmentType === 'return' ? 'to add' : 'to remove'})</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter amount (e.g., 50)"
                    min="1"
                    required
                    className="mt-2 py-6 text-lg transition-colors focus-visible:ring-primary"
                    disabled={submitting || !selectedProduct}
                  />
                </div>

                {/* Reason/Notes */}
                <div className="animate-in fade-in fill-mode-both delay-200">
                  <Label htmlFor="reason">Additional Notes (Optional)</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide context for this adjustment..."
                    className="mt-2 resize-none transition-colors focus-visible:ring-primary"
                    rows={4}
                    disabled={submitting}
                  />
                </div>

                {/* Preview */}
                {selectedProductData && quantity && (
                  <div className="p-5 bg-secondary/50 rounded-xl border border-secondary transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in">
                    <p className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider text-muted-foreground">Impact Preview</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Current Stock:</span>
                        <span className="font-medium text-foreground">{selectedProductData.available_quantity} {selectedProductData.unit}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {adjustmentType === 'restock' || adjustmentType === 'return' ? 'Adding:' : 'Removing:'}
                        </span>
                        <span
                          className={`font-semibold ${adjustmentType === 'restock' || adjustmentType === 'return' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {adjustmentType === 'restock' || adjustmentType === 'return' ? '+' : '-'}
                          {quantity} {selectedProductData.unit}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-border flex justify-between items-center">
                        <span className="font-semibold text-foreground">Projected Stock:</span>
                        <span className="font-bold text-primary text-xl">
                          {adjustmentType === 'restock' || adjustmentType === 'return'
                            ? selectedProductData.available_quantity + parseInt(quantity || '0')
                            : Math.max(0, selectedProductData.available_quantity - parseInt(quantity || '0'))}{' '}
                          {selectedProductData.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className={`w-full py-6 text-base font-semibold transition-all ${submitting ? 'opacity-90' : 'hover:scale-[1.01]'}`}
                  disabled={submitting || !selectedProduct || !quantity}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    'Confirm Adjustment'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
