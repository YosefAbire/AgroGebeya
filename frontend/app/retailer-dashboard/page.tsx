'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RetailerDashboardRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/retailer')
  }, [router])
  return null
}
