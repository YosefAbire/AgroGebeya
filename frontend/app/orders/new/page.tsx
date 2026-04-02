'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Header from '@/components/Header'
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useAuthContext } from '@/components/AuthProvider'
import { productService } from '@/lib/product-service'
import { orderService } from '@/lib/order-service'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const { user, token } = useAuthContext()
  const [items, setItems] = useState<OrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      toast.error('Please login to create orders')
      router.push('/auth/login')
      return
    }

    if (user.role !== 'retailer') {
      toast.error('Only retailers can create orders')
      router.push('/dashboard')
      return
    }

    loadProducts()
  }, [user])

  const loadProducts = async () => {
    try {
      const data = await productService.getProducts(token)
      setProducts(data)
    } catch (error) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    if (!selectedProduct || !quantity) return

    const product = products.find(p => p.id === Number(selectedProduct))
    if (!product) return

    const qty = parseInt(quantity)
    if (qty <= 0 || qty > product.available_quantity) {
      toast.error(`Maximum available quantity is ${product.available_quantity}`)
      return
    }

    const newItem: OrderItem = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice: product.price,
      total: qty * product.price,
    }

    setItems([...items, newItem])
    setSelectedProduct('')
    setQuantity('')
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0) {
      toast.error('Please add at least one product')
      return
    }

    if (!deliveryDate) {
      toast.error('Please select a delivery date')
      return
    }

    setSubmitting(true)
    try {
      // Create orders for each item (backend creates one order per product)
      for (const item of items) {
        await orderService.createOrder({
          product_id: item.productId,
          quantity: item.quantity,
          delivery_date: deliveryDate,
        }, token!)
      }

      toast.success('Orders placed successfully!')
      router.push('/orders')
    } catch (error: any) {
      toast.error(error.message || 'Failed to place orders')
    } finally {
      setSubmitting(false)
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * 0.15
  const total = subtotal + tax

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/orders">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create New Order</h1>
            <p className="text-muted-foreground">Add products and place your order</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>Provide order information and select products</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {/* Delivery Information */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-foreground">Delivery Information</h3>
                    <div>
                      <Label htmlFor="deliveryDate">Delivery Date</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Delivery Address (Optional)</Label>
                      <Textarea
                        id="address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter delivery address"
                        className="mt-2 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Product Selection */}
                  <div className="space-y-3 border-t pt-6">
                    <h3 className="font-medium text-foreground">Add Products</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="product">Product</Label>
                          <select
                            id="product"
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mt-2"
                          >
                            <option value="">Select a product</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                              {product.name} - {product.category} ({product.price} ETB/{product.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="qty">Quantity</Label>
                          <Input
                            id="qty"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="0"
                            min="1"
                            className="mt-2"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            onClick={handleAddItem}
                            variant="outline"
                            className="w-full gap-2 bg-transparent"
                          >
                            <Plus className="h-4 w-4" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  {items.length > 0 && (
                    <div className="space-y-3 border-t pt-6">
                      <h3 className="font-medium text-foreground">Order Items</h3>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{item.productName}</p>
                              <p className="text-sm text-muted-foreground">{item.quantity} units × {item.unitPrice} ETB</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-medium text-foreground">{item.total.toLocaleString()} ETB</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-3 border-t pt-6">
                    <Label htmlFor="notes">Special Instructions (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special delivery or product requirements..."
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={items.length === 0 || !deliveryDate || submitting}
                    className="w-full h-11"
                  >
                    {submitting ? 'Placing Orders...' : 'Place Orders'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 ? (
                  <div className="p-4 bg-muted rounded-lg flex gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Add products to your order</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Items: {items.length}</p>
                      <div className="py-2 border-t border-border">
                        <p className="text-sm font-medium text-foreground">Subtotal</p>
                        <p className="text-lg font-bold text-foreground">{subtotal.toLocaleString()} ETB</p>
                      </div>
                      <div className="py-2">
                        <p className="text-sm font-medium text-foreground">Tax (15%)</p>
                        <p className="text-lg font-bold text-foreground">{tax.toLocaleString()} ETB</p>
                      </div>
                      <div className="py-2 border-t border-border bg-muted rounded-lg p-3">
                        <p className="text-sm font-medium text-foreground">Total</p>
                        <p className="text-2xl font-bold text-primary">{total.toLocaleString()} ETB</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
