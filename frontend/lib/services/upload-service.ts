import { api } from '../api'

export interface ProductImage {
  id: number
  image_url: string
  is_primary: boolean
  display_order: number
}

export interface ImageUploadResponse {
  url: string
  message: string
}

class UploadService {
  /**
   * Upload a product image
   */
  async uploadProductImage(
    productId: number,
    file: File,
    isPrimary: boolean = false,
    token: string
  ): Promise<ImageUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/uploads/products/${productId}/images?is_primary=${isPrimary}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error('Failed to upload image')
    }

    return response.json()
  }

  /**
   * Get all images for a product
   */
  async getProductImages(productId: number): Promise<ProductImage[]> {
    return api.get<ProductImage[]>(`/api/uploads/products/${productId}/images`)
  }

  /**
   * Delete a product image
   */
  async deleteProductImage(imageId: number, token: string): Promise<void> {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/uploads/products/images/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(file: File, token: string): Promise<ImageUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/uploads/profile/image`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      }
    )

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error((err as any).detail || 'Failed to upload profile image')
    }

    return response.json()
  }

  async deleteProfileImage(token: string): Promise<void> {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/uploads/profile/image`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      }
    )
  }

  /**
   * Get full image URL
   */
  getImageUrl(path: string): string {
    if (!path) return ''
    if (path.startsWith('http')) return path
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${path}`
  }
}

export const uploadService = new UploadService()
