'use client'

import React, { useState, useEffect } from 'react'
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
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  })

  useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

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

      // Read role directly from localStorage (set by login()) to avoid state race
      const storedUser = localStorage.getItem('user')
      const role = storedUser ? JSON.parse(storedUser).role : null

      const destination =
        role === 'admin' ? '/admin' :
        role === 'retailer' ? '/dashboard/retailer' :
        '/dashboard/farmer'

      router.push(destination)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (username: string, password = 'password123') => {
    setError('')
    setSuccess('')
    setIsLoading(true)
    try {
      await login(username, password)
      const storedUser = localStorage.getItem('user')
      const role = storedUser ? JSON.parse(storedUser).role : null
      const destination =
        role === 'admin' ? '/admin' :
        role === 'retailer' ? '/dashboard/retailer' :
        '/dashboard/farmer'
      router.push(destination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const FEATURES = [
    { icon: '🌱', title: 'List & Sell Products', desc: 'Farmers list crops with real-time pricing and availability' },
    { icon: '🛒', title: 'Browse & Order', desc: 'Retailers discover and order directly from local farmers' },
    { icon: '🚚', title: 'Track & Deliver', desc: 'End-to-end order tracking with transport management' },
    { icon: '💳', title: 'Secure Payments', desc: 'Integrated Chapa payment gateway for safe transactions' },
  ]

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── Left panel ── */}
      <div
        className={`hidden lg:flex lg:w-1/2 bg-green-700 flex-col justify-between p-12 relative overflow-hidden
          transition-all duration-700 ease-out
          ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
      >
        {/* Background circles */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border-2 border-white"
              style={{ width: `${(i+1)*120}px`, height: `${(i+1)*120}px`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}
            />
          ))}
        </div>

        {/* Logo */}
        <div className={`relative z-10 transition-all duration-700 delay-200 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h1 className="text-3xl font-bold text-white tracking-tight">🌾 AgroGebeya</h1>
          <p className="text-green-200 mt-1 text-sm">Ethiopia's Agricultural Marketplace</p>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-8">
          <div className={`transition-all duration-700 delay-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="text-white text-2xl font-bold leading-snug">
              Connecting Farmers,<br />Retailers & Markets
            </h2>
            <p className="text-green-200 mt-3 text-sm leading-relaxed max-w-sm">
              A digital platform bridging Ethiopian farmers and retailers — enabling direct trade, fair pricing, and transparent supply chains.
            </p>
          </div>

          {/* Feature list — each item staggers in */}
          <div className="space-y-4">
            {FEATURES.map(({ icon, title, desc }, i) => (
              <div
                key={title}
                className={`flex items-start gap-3 transition-all duration-500 ease-out
                  ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                style={{ transitionDelay: `${400 + i * 120}ms` }}
              >
                <span className="text-xl mt-0.5">{icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-green-200 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '900ms' }}>
          <p className="text-green-300 text-xs">Trusted by farmers and retailers across Ethiopia</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className={`flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background
          transition-all duration-700 ease-out
          ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-1">🌾 AgroGebeya</h1>
            <p className="text-muted-foreground text-sm">Ethiopia's Agricultural Marketplace</p>
          </div>

          <div className={`mb-8 transition-all duration-700 delay-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Back to Home
            </Link>
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {/* Form Card */}
          <div className={`bg-card rounded-xl shadow-sm p-8 border border-border
            transition-all duration-700 ease-out
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '400ms' }}
          >
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
                    className="pl-10"
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
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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

              {/* Error / Success */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm p-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded text-green-700 text-sm p-3 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Demo accounts */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-xs font-medium text-foreground">Quick Login (Demo Accounts):</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Farmer', username: 'yosef', password: 'password123' },
                    { label: 'Retailer', username: 'retailer1', password: 'password123' },
                    { label: 'Admin', username: 'admin', password: 'admin123' },
                  ].map(({ label, username, password }) => (
                    <Button
                      key={label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDemoLogin(username, password)}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </form>

            <div className="mt-6 text-center border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our{' '}
            <Link href="#" className="text-primary hover:text-primary/80">Terms of Service</Link>
            {' '}and{' '}
            <Link href="#" className="text-primary hover:text-primary/80">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
