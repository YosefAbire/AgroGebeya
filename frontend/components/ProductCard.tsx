'use client'

import { MapPin, ShoppingCart, Eye } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface ProductCardProps {
  id: string
  name: string
  category: string
  price: number
  unit: string
  available: number
  location: string
  image?: string
  farmer?: string
  onViewDetails?: () => void
}

// Helper function to safely construct image URL
function getImageUrl(image: string | undefined): string | null {
  if (!image || typeof image !== 'string') return null;
  
  const trimmed = image.trim();
  if (!trimmed) return null;
  
  // If already a full URL, return as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // If it's a relative path, prepend backend URL
  if (trimmed.startsWith('/')) {
    return `http://127.0.0.1:8000${trimmed}`;
  }
  
  // Invalid format
  return null;
}

export default function ProductCard({
  id,
  name,
  category,
  price,
  unit,
  available,
  location,
  image,
  farmer,
  onViewDetails,
}: ProductCardProps) {
  const imageUrl = getImageUrl(image);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="relative h-48 w-full overflow-hidden bg-secondary">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            unoptimized
            onError={(e) => {
              // Hide image on error and show fallback
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        {!imageUrl && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-4xl">📦</p>
              <p className="mt-2 text-sm font-medium">{category}</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-foreground text-balance">{name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{category}</p>

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-xl font-bold text-primary">{price}</span>
          <span className="text-sm text-muted-foreground">ETB/{unit}</span>
        </div>

        {/* Availability */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Available:</span>
          <span className={`text-xs font-semibold ${available > 50 ? 'text-green-600' : available > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
            {available} {unit}
          </span>
        </div>

        {/* Location */}
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {location}
        </div>

        {farmer && <p className="mt-2 text-xs text-muted-foreground">by {farmer}</p>}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link
            href={`/product/${id}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Eye className="h-4 w-4" />
            View
          </Link>
          <button
            onClick={onViewDetails}
            className="flex-1 rounded-lg border border-border bg-secondary text-foreground py-2 text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Order
          </button>
        </div>
      </div>
    </div>
  )
}
