'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (!email) {
        setError('Please enter your email address')
        setIsLoading(false)
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address')
        setIsLoading(false)
        return
      }

      // Mock successful submission
      setSubmitted(true)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-lg p-8 border border-border text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">Check your email</h2>
            <p className="text-muted-foreground mb-6">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>

            <div className="bg-secondary/50 rounded p-4 text-sm text-muted-foreground mb-6 space-y-2">
              <p>Please check your email for:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Password reset link</li>
                <li>Instructions to create a new password</li>
                <li>Link expires in 24 hours</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Back to Login
              </Button>
              <Button
                onClick={() => setSubmitted(false)}
                variant="outline"
                className="w-full"
              >
                Try another email
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              Didn't receive an email? Check your spam folder or{' '}
              <button
                onClick={() => router.push('/contact')}
                className="text-primary hover:text-primary/80"
              >
                contact support
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
          <h1 className="text-3xl font-bold text-primary mb-2">Reset Password</h1>
          <p className="text-muted-foreground">Enter your email address and we'll send you instructions to reset your password</p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  className="pl-10 bg-secondary/50 border-border focus:border-primary"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm p-3">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>

            {/* Info Box */}
            <div className="bg-secondary/50 rounded p-4 text-xs text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">What happens next:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>We'll email you a password reset link</li>
                <li>Click the link to create a new password</li>
                <li>You'll be able to log in immediately</li>
              </ol>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
