'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validation
      if (!formData.username || !formData.password) {
        throw new Error('Please fill in all fields')
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      // Call backend API
      await login(formData.username, formData.password)

      setSuccess('Login successful! Redirecting...')
      
      // Brief delay to show success message
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (username: string) => {
    setFormData({
      username: username,
      password: 'password123',
      rememberMe: false,
    })
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">AgroGebeya</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-foreground">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="your_username"
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10 bg-secondary/50 border-border focus:border-primary"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 bg-secondary/50 border-border focus:border-primary"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border accent-primary"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded text-green-700 text-sm p-3 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Demo Accounts Info */}
            <div className="bg-secondary/50 rounded p-4 space-y-3">
              <p className="text-xs font-medium text-foreground">Available Test Accounts:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('yosef')}
                  disabled={isLoading}
                  className="text-xs"
                >
                  Yosef (Farmer)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('farmer1')}
                  disabled={isLoading}
                  className="text-xs"
                >
                  Farmer1
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 border-t border-border/30 pt-3">
                <p className="font-medium text-foreground">Test Credentials:</p>
                <p>Username: yosef | Password: password123</p>
                <p>Username: farmer1 | Password: password123</p>
                <p>Username: retailer1 | Password: password123</p>
              </div>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our{' '}
          <Link href="#" className="text-primary hover:text-primary/80">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="#" className="text-primary hover:text-primary/80">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
