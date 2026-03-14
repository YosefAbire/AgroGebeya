'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { verificationService } from '@/lib/services/verification-service'
import { VerificationForm } from '@/components/verification/VerificationForm'
import { VerificationStatus } from '@/lib/types-extended'

interface VerificationState {
  status: VerificationStatus
  submitted_at?: string
  reviewed_at?: string
  rejection_reason?: string
}

const STATUS_CONFIG = {
  [VerificationStatus.UNVERIFIED]: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200',
    title: 'Not Verified',
    description: 'Submit your Ethiopian National ID to verify your identity and unlock full platform access.',
  },
  [VerificationStatus.PENDING]: {
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    title: 'Under Review',
    description: 'Your National ID has been submitted and is being reviewed. This usually takes 1–2 business days.',
  },
  [VerificationStatus.VERIFIED]: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    title: 'Verified',
    description: 'Your identity has been verified. You have full access to all platform features.',
  },
  [VerificationStatus.REJECTED]: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    title: 'Verification Rejected',
    description: 'Your verification was rejected. Please review the reason below and resubmit.',
  },
}

export default function VerificationPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [verification, setVerification] = useState<VerificationState | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStatus = useCallback(async () => {
    if (!token) return
    try {
      const data = await verificationService.getStatus(token)
      setVerification({
        status: data.status as VerificationStatus,
        submitted_at: data.submitted_at,
        reviewed_at: data.reviewed_at,
        rejection_reason: data.rejection_reason,
      })
    } catch {
      setVerification({ status: VerificationStatus.UNVERIFIED })
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!authLoading) loadStatus()
  }, [authLoading, loadStatus])

  const handleSuccess = () => {
    setVerification({ status: VerificationStatus.PENDING })
  }

  const canSubmit =
    verification?.status === VerificationStatus.UNVERIFIED ||
    verification?.status === VerificationStatus.REJECTED

  const config = verification ? STATUS_CONFIG[verification.status] : null

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/profile" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Identity Verification</h1>
            <p className="text-muted-foreground text-sm">Verify your Ethiopian National ID</p>
          </div>
        </div>

        {/* Why verify */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="font-semibold text-foreground mb-3">Why verify?</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />Create and list products for sale</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />Place and receive orders</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />Access payment and transport features</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />Build trust with buyers and sellers</li>
          </ul>
        </div>

        {/* Status card */}
        {!loading && config && (
          <div className={`rounded-lg border p-5 ${config.bg}`}>
            <div className="flex items-start gap-3">
              <config.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
              <div className="flex-1">
                <p className={`font-semibold ${config.color}`}>{config.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                {verification?.rejection_reason && (
                  <div className="mt-3 p-3 bg-white/60 rounded border border-red-200">
                    <p className="text-sm font-medium text-red-800">Rejection reason:</p>
                    <p className="text-sm text-red-700 mt-1">{verification.rejection_reason}</p>
                  </div>
                )}
                {verification?.submitted_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Submitted: {new Date(verification.submitted_at).toLocaleDateString()}
                    {verification.reviewed_at && ` • Reviewed: ${new Date(verification.reviewed_at).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form — show when unverified or rejected */}
        {!loading && token && canSubmit && (
          <VerificationForm token={token} onSuccess={handleSuccess} />
        )}

        {/* Already verified */}
        {!loading && verification?.status === VerificationStatus.VERIFIED && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">You are verified</h3>
            <p className="text-muted-foreground mb-6">Your identity has been confirmed. All features are unlocked.</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* Pending — no form */}
        {!loading && verification?.status === VerificationStatus.PENDING && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              Need help? Contact support at{' '}
              <a href="mailto:support@agrogebeya.com" className="text-primary hover:underline">
                support@agrogebeya.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
