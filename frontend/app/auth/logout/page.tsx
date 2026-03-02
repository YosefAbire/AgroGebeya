'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      localStorage.removeItem('rememberMe')
      router.push('/auth/login')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Logged Out Successfully</h1>
          <p className="text-muted-foreground mb-8">
            You have been logged out. Redirecting to login page...
          </p>

          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Redirecting automatically in a moment...</p>
            <Button
              asChild
              className="w-full"
            >
              <Link href="/auth/login">
                Back to Login
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
