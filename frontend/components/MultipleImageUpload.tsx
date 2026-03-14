'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Upload, X, Star } from 'lucide-react'
import Image from 'next/image'

interface ImageItem {
  id?: number
  url: string
  isPrimary: boolean
  file?: File
}

interface MultipleImageUploadProps {
  images: ImageItem[]
  onUpload: (file: File, isPrimary: boolean) => Promise<void>
  onRemove: (imageId: number, url: string) => Promise<void>
  onSetPrimary?: (imageId: number) => Promise<void>
  maxImages?: number
  maxSize?: number // in MB
  className?: string
}

export default function MultipleImageUpload({
  images,
  onUpload,
  onRemove,
  onSetPrimary,
  maxImages = 5,
  maxSize = 5,
  className = '',
}: MultipleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check max images limit
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`)
        }

        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`${file.name} exceeds ${maxSize}MB`)
        }

        // Upload file (first image is primary if no images exist)
        const isPrimary = images.length === 0
        await onUpload(file, isPrimary)
      }

      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (imageId: number, url: string) => {
    setUploading(true)
    setError(null)
    try {
      await onRemove(imageId, url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image')
    } finally {
      setUploading(false)
    }
  }

  const handleSetPrimary = async (imageId: number) => {
    if (!onSetPrimary) return
    
    setUploading(true)
    setError(null)
    try {
      await onSetPrimary(imageId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary image')
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image, index) => {
          // Handle different URL types
          let imageSrc = image.url
          if (!imageSrc.startsWith('data:') && !imageSrc.startsWith('http')) {
            imageSrc = `http://127.0.0.1:8000${imageSrc}`
          }
          
          return (
            <div key={image.id || index} className="relative group">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-border">
                <Image
                  src={imageSrc}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </div>
                )}
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!image.isPrimary && onSetPrimary && image.id && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(image.id!)}
                    disabled={uploading}
                    className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-yellow-100 dark:hover:bg-yellow-900 transition-colors"
                    title="Set as primary"
                  >
                    <Star className="h-3.5 w-3.5 text-yellow-600" />
                  </button>
                )}
                {image.id && (
                  <button
                    type="button"
                    onClick={() => handleRemove(image.id!, image.url)}
                    disabled={uploading}
                    className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                    title="Remove image"
                  >
                    <X className="h-3.5 w-3.5 text-red-600" />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Upload Button */}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="w-full aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground text-center px-2">
                  Add Image
                  <br />
                  ({images.length}/{maxImages})
                </p>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Upload up to {maxImages} images. First image or starred image will be the primary display image. Max {maxSize}MB per image.
      </p>
    </div>
  )
}
