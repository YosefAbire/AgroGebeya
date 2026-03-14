'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { api } from '@/lib/api'
import Link from 'next/link'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { token } = useAuth()
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const txRef = searchParams.get('trx_ref') || searchParams.get('tx_ref')
    if (!txRef || !token) {
      setStatus('failed')
      setMessage('Missing transaction reference.')
      return
    }
    verifyPayment(txRef)
  }, [token])

  const verifyPayment = async (txRef: string) => {
    try {
      await api.get(`/api/v1/payments/verify/${txRef}`, token ?? undefined)
      setStatus('success')
      setMessage('Your payment has been confirmed and recorded.')
    } catch (err: any) {
      setStatus('failed')
      setMessage(err.message || 'Payment verification failed.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
            <h1 className="text-2xl font-bold text-foreground">Verifying Payment...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Payment Successful</h1>
            <p className="text-muted-foreground">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/orders/history">
                <Button>View Orders</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Payment Issue</h1>
            <p className="text-muted-foreground">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/payment">
                <Button>Try Again</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
