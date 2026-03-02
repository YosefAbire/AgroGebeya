'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, User, Phone, MapPin, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'farmer',
    location: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })

  const calculatePasswordStrength = (password: string) => {
    if (password.length < 6) return 'weak'
    if (password.length < 10 || !/[^a-zA-Z0-9]/.test(password)) return 'medium'
    return 'strong'
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }

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
      if (!formData.name || !formData.email || !formData.phone || !formData.location || !formData.password) {
        throw new Error('Please fill in all fields')
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Please enter a valid email address')
      }

      if (!/^\+?[0-9\s\-()]+$/.test(formData.phone)) {
        throw new Error('Please enter a valid phone number')
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (!formData.agreeToTerms) {
        throw new Error('Please agree to the Terms of Service')
      }

      // Simulate registration delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock successful registration
      const userData = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        location: formData.location,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
      }

      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('authToken', `token_${Date.now()}`)

      setSuccess('Account created successfully! Redirecting to dashboard...')
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary px-4 py-12">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join AgroGebeya and start your journey</p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 bg-secondary/50 border-border focus:border-primary"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 bg-secondary/50 border-border focus:border-primary"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+251 9XX XXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 bg-secondary/50 border-border focus:border-primary"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-foreground">
                Account Type
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground focus:border-primary outline-none transition-colors"
                disabled={isLoading}
                required
              >
                <option value="farmer">Farmer / Supplier</option>
                <option value="retailer">Retailer / Buyer</option>
              </select>
            </div>

            {/* Location Field */}
            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-foreground">
                Location / Region
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="e.g., Addis Ababa, Oromia"
                  value={formData.location}
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
              {formData.password && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 bg-secondary rounded h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength === 'weak'
                          ? 'w-1/3 bg-destructive'
                          : passwordStrength === 'medium'
                            ? 'w-2/3 bg-accent'
                            : 'w-full bg-green-500'
                      }`}
                    />
                  </div>
                  <span className={`font-medium ${
                    passwordStrength === 'weak'
                      ? 'text-destructive'
                      : passwordStrength === 'medium'
                        ? 'text-accent'
                        : 'text-green-600'
                  }`}>
                    {passwordStrength}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 pr-10 bg-secondary/50 border-border focus:border-primary"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border accent-primary mt-1 flex-shrink-0"
                disabled={isLoading}
                required
              />
              <span className="text-sm text-muted-foreground">
                I agree to the{' '}
                <Link href="#" className="text-primary hover:text-primary/80">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="#" className="text-primary hover:text-primary/80">
                  Privacy Policy
                </Link>
              </span>
            </label>

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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
