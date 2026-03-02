'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export default function Dashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/auth/login')
      return
    }

    // Redirect based on user role
    switch (user.role) {
      case 'farmer':
        router.push('/dashboard/farmer')
        break
      case 'retailer':
        router.push('/dashboard/retailer')
        break
      case 'admin':
        router.push('/admin/dashboard')
        break
      default:
        router.push('/dashboard/farmer')
    }
  }, [user, loading, router])

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  )
}
