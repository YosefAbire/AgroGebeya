'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { verificationService } from '@/lib/services/verification-service';
import { CheckCircle, ScanLine, Hash, CreditCard, X } from 'lucide-react';

interface VerificationFormProps {
  token: string;
  onSuccess?: () => void;
}

type InputMethod = 'fin' | 'sn' | 'scan';

const METHOD_CONFIG: Record<InputMethod, { label: string; icon: typeof Hash; digits: number; placeholder: string; description: string }> = {
  fin: {
    label: 'FIN',
    icon: Hash,
    digits: 12,
    placeholder: '123456789012',
    description: 'Fayda ID Number — 12 digits printed on your national ID card',
  },
  sn: {
    label: 'Serial Number',
    icon: CreditCard,
    digits: 8,
    placeholder: '12345678',
    description: 'Serial Number — 8 digits on the back of your national ID card',
  },
  scan: {
    label: 'Scan Barcode',
    icon: ScanLine,
    digits: 0,
    placeholder: 'Scan or paste barcode value...',
    description: 'Scan the barcode/QR code on your national ID card',
  },
}

function validateId(method: InputMethod, value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (method === 'fin' && digits.length !== 12) return 'FIN must be exactly 12 digits'
  if (method === 'sn' && digits.length !== 8) return 'Serial Number must be exactly 8 digits'
  if (method === 'scan') {
    if (digits.length !== 8 && digits.length !== 12) return 'Scanned ID must be 8 digits (SN) or 12 digits (FIN)'
  }
  return null
}

export function VerificationForm({ token, onSuccess }: VerificationFormProps) {
  const [method, setMethod] = useState<InputMethod>('fin')
  const [idValue, setIdValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const scanInputRef = useRef<HTMLInputElement>(null)

  const handleMethodChange = (m: InputMethod) => {
    setMethod(m)
    setIdValue('')
    setError(null)
    if (m === 'scan') {
      setTimeout(() => scanInputRef.current?.focus(), 100)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // For FIN and SN, only allow digits
    if (method !== 'scan') {
      const digits = raw.replace(/\D/g, '')
      const max = METHOD_CONFIG[method].digits
      setIdValue(digits.slice(0, max))
    } else {
      setIdValue(raw)
    }
    setError(null)
  }

  // Scan: accept input from barcode scanner (fires as rapid keystrokes ending in Enter)
  const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const digits = idValue.replace(/\D/g, '')
    const validationError = validateId(method, digits)
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await verificationService.submit({ national_id: digits }, token)
      setSuccess(true)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Verification Submitted</h3>
            <p className="text-muted-foreground text-sm">
              Your National ID has been submitted for review. You will be notified once it is approved.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const config = METHOD_CONFIG[method]

  return (
    <Card>
      <CardHeader>
        <CardTitle>National ID Verification</CardTitle>
        <CardDescription>Choose how you want to enter your Ethiopian National ID</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Method selector */}
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(METHOD_CONFIG) as InputMethod[]).map((m) => {
            const Icon = METHOD_CONFIG[m].icon
            return (
              <button
                key={m}
                type="button"
                onClick={() => handleMethodChange(m)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-all ${
                  method === m
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {METHOD_CONFIG[m].label}
              </button>
            )
          })}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">{config.description}</p>

        {/* Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                {error}
                <button type="button" onClick={() => setError(null)}><X className="h-4 w-4" /></button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="national_id">
              {method === 'fin' ? 'FIN (12 digits)' : method === 'sn' ? 'Serial Number (8 digits)' : 'Barcode / QR Value'}
            </Label>
            <div className="relative">
              <Input
                id="national_id"
                ref={method === 'scan' ? scanInputRef : undefined}
                value={idValue}
                onChange={handleChange}
                onKeyDown={method === 'scan' ? handleScanKeyDown : undefined}
                placeholder={config.placeholder}
                inputMode={method !== 'scan' ? 'numeric' : 'text'}
                autoComplete="off"
                autoFocus={method === 'scan'}
                className="pr-16 font-mono tracking-widest"
                disabled={loading}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums">
                {idValue.replace(/\D/g, '').length}
                {method !== 'scan' && `/${config.digits}`}
              </span>
            </div>

            {/* Progress dots for FIN/SN */}
            {method !== 'scan' && (
              <div className="flex gap-1 pt-1">
                {Array.from({ length: config.digits }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < idValue.length ? 'bg-primary' : 'bg-secondary'
                    }`}
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Your ID will be encrypted and stored securely.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || idValue.replace(/\D/g, '').length === 0}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
