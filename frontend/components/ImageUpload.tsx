'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  onUpload: (file: File) => Promise<string>
  onRemove?: () => Promise<void>
  currentImage?: string
  label?: string
  accept?: string
  maxSize?: number // in MB
  className?: string
  multiple?: boolean
}

export default function ImageUpload({
  onUpload,
  onRemove,
  currentImage,
  label = 'Upload Image',
  accept = 'image/*',
  maxSize = 5,
  className = '',
  multiple = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      await onUpload(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!onRemove) return

    setUploading(true)
    try {
      await onRemove()
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image')
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        multiple={multiple}
      />

      {preview ? (
        <div className="relative group">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-border">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized={preview.startsWith('data:')}
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={handleClick}
              disabled={uploading}
              className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Change image"
            >
              <Upload className="h-4 w-4" />
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                title="Remove image"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">
                Click to upload (max {maxSize}MB)
              </p>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
