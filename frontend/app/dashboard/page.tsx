'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export default function Dashboard() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace('/auth/login')
      return
    }

    switch (user.role) {
      case 'farmer':
        router.replace('/dashboard/farmer')
        break
      case 'retailer':
        router.replace('/dashboard/retailer')
        break
      case 'admin':
        router.replace('/admin/dashboard')
        break
      default:
        router.replace('/dashboard/farmer')
    }
  }, [user, isLoading, router])

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
