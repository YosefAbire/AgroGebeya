'use client'

import { MapPin, User, Truck, ShoppingCart, ArrowLeft } from 'lucide-react'
import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/Header'
import Link from 'next/link'
import { useAuthContext } from '@/components/AuthProvider'
import { productService } from '@/lib/product-service'
import { orderService } from '@/lib/order-service'
import { toast } from 'sonner'

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, token } = useAuthContext()
  const [quantity, setQuantity] = useState(1)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactMessage, setContactMessage] = useState('')

  useEffect(() => {
    loadProduct()
  }, [id])

  const loadProduct = async () => {
    try {
      const data = await productService.getProduct(Number(id), token ?? undefined)
      setProduct(data)
    } catch (error) {
      toast.error('Failed to load product')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place an order')
      router.push('/auth/login')
      return
    }

    if (user.role !== 'retailer') {
      toast.error('Only retailers can place orders')
      return
    }

    if (product.available_quantity < quantity) {
      toast.error('Requested quantity exceeds available stock')
      return
    }

    if (!deliveryDate) {
      toast.error('Please select a delivery date')
      return
    }

    setSubmitting(true)
    try {
      await orderService.createOrder({
        product_id: Number(id),
        quantity,
        delivery_date: deliveryDate,
      }, token!)

      toast.success('Order placed successfully!')
      router.push('/orders')
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleContactFarmer = () => {
    setShowContactForm(!showContactForm)
  }

  const handleSendMessage = () => {
    if (!contactMessage.trim()) {
      toast.error('Please enter a message')
      return
    }
    toast.success('Message sent to farmer!')
    setContactMessage('')
    setShowContactForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Product not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/90 transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Products
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Product Image */}
          <div className="lg:col-span-1">
            {product.images && product.images.length > 0 ? (
              <div className="space-y-4">
                {/* Main Image */}
                <div className="rounded-lg border border-border bg-secondary h-96 overflow-hidden">
                  <Image
                    src={(() => {
                      const primaryImage = product.images.find((img: any) => img.is_primary)?.image_url || product.images[0]?.image_url;
                      return primaryImage?.startsWith('http') ? primaryImage : `http://127.0.0.1:8000${primaryImage}`;
                    })()}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                {/* Thumbnail Gallery */}
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((img: any, idx: number) => (
                      <div
                        key={img.id || idx}
                        className="relative aspect-square rounded-lg border border-border overflow-hidden cursor-pointer hover:border-primary transition-colors"
                      >
                        <Image
                          src={img.image_url.startsWith('http') ? img.image_url : `http://127.0.0.1:8000${img.image_url}`}
                          alt={`${product.name} ${idx + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : product.image_url ? (
              <div className="rounded-lg border border-border bg-secondary h-96 overflow-hidden">
                <Image
                  src={product.image_url.startsWith('http') ? product.image_url : `http://127.0.0.1:8000${product.image_url}`}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-secondary h-96 flex items-center justify-center overflow-hidden">
                <div className="text-center text-muted-foreground">
                  <p className="text-6xl">📦</p>
                  <p className="mt-4 text-sm">{product.category}</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Info and Order Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
                  <p className="mt-2 text-muted-foreground">{product.category}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-lg font-semibold text-foreground">{product.reviews}/5</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={i < Math.floor(product.reviews) ? 'text-yellow-400' : 'text-gray-300'}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Price and Availability */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price per Unit</p>
                  <p className="text-4xl font-bold text-primary mt-1">
                    {product.price} <span className="text-lg text-muted-foreground">ETB/{product.unit}</span>
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {product.available_quantity} {product.unit} in stock
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${Math.min((product.available_quantity / 200) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Farmer Information */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Farmer Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Farmer</p>
                    <p className="text-foreground font-medium">Farmer #{product.farmer_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-foreground font-medium">{product.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Available</p>
                    <p className="text-foreground font-medium">Yes, same city or nearby regions</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleContactFarmer}
                className="mt-4 w-full rounded-lg border border-primary px-4 py-2 text-center font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                Contact Farmer
              </button>

              {showContactForm && (
                <div className="mt-4 space-y-3 p-4 bg-secondary/50 rounded-lg">
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Type your message to the farmer..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSendMessage}
                      className="flex-1 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Send Message
                    </button>
                    <button
                      onClick={() => setShowContactForm(false)}
                      className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Form */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Place Your Order</h3>

              <div className="space-y-4">
                {/* Quantity */}
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-foreground">
                    Quantity ({product.unit})
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="rounded-lg border border-border bg-secondary px-4 py-2 text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      −
                    </button>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      max={product.available_quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(product.available_quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-20 rounded-lg border border-border bg-card px-3 py-2 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.available_quantity, quantity + 1))}
                      className="rounded-lg border border-border bg-secondary px-4 py-2 text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      +
                    </button>
                    <span className="text-sm text-muted-foreground">(Max: {product.available_quantity} {product.unit})</span>
                  </div>
                </div>

                {/* Delivery Date */}
                <div>
                  <label htmlFor="delivery" className="block text-sm font-medium text-foreground">
                    Preferred Delivery Date
                  </label>
                  <input
                    id="delivery"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Total */}
                <div className="rounded-lg bg-secondary p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-foreground">Order Total:</span>
                    <span className="text-3xl font-bold text-primary">
                      {(product.price * quantity).toLocaleString()} ETB
                    </span>
                  </div>
                </div>

                {/* Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting || !deliveryDate || product.available_quantity === 0}
                  className="w-full rounded-lg bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>Processing...</>
                  ) : product.available_quantity === 0 ? (
                    <>Out of Stock</>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Place Order
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-muted-foreground">
                  By placing an order, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-12 rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl font-bold text-foreground">Product Description</h2>
          <p className="mt-4 text-foreground leading-relaxed">{product.description}</p>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-foreground">Product Details</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="mt-1 font-medium text-foreground">{product.category}</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-sm text-muted-foreground">Unit</p>
                <p className="mt-1 font-medium text-foreground">{product.unit}</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="mt-1 font-medium text-foreground">{product.location}</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-sm text-muted-foreground">Available Quantity</p>
                <p className="mt-1 font-medium text-foreground">{product.available_quantity} {product.unit}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
