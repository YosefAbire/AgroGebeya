'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, User, Phone, MapPin, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

const FEATURES = [
  { icon: '🌾', title: 'For Farmers', desc: 'List your produce, set your price, and sell directly to verified retailers across Ethiopia.' },
  { icon: '🛒', title: 'For Retailers', desc: 'Browse fresh produce from hundreds of local farmers and place orders in minutes.' },
  { icon: '📦', title: 'Order Tracking', desc: 'Real-time status updates from order placement to delivery at your door.' },
  { icon: '🔐', title: 'Verified & Secure', desc: 'National ID verification and Chapa-powered payments keep every transaction safe.' },
  { icon: '📊', title: 'Analytics & Reports', desc: 'Track your sales, revenue, and inventory with built-in dashboards.' },
]

const STATS = [
  { value: '10,000+', label: 'Farmers' },
  { value: '3,000+', label: 'Retailers' },
  { value: '50+', label: 'Cities' },
]

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong' | ''>('')
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', role: 'farmer',
    location: '', password: '', confirmPassword: '', agreeToTerms: false,
  })

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const calcStrength = (p: string) => {
    if (!p) return ''
    if (p.length < 6) return 'weak'
    if (p.length < 10 || !/[^a-zA-Z0-9]/.test(p)) return 'medium'
    return 'strong'
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData(p => ({ ...p, [name]: val }))
    if (name === 'password') setStrength(calcStrength(value) as any)
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.agreeToTerms) { setError('Please agree to the Terms of Service'); return }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return }
    if (!formData.name.trim()) { setError('Full name is required'); return }
    if (!formData.phone.trim()) { setError('Phone number is required'); return }
    if (!formData.email.trim()) { setError('Email address is required'); return }
    if (!formData.location.trim()) { setError('Location is required'); return }
    if (!formData.password) { setError('Password is required'); return }
    setIsLoading(true); setError('')
    try {
      await register({
        name: formData.name, email: formData.email, phone: formData.phone,
        role: formData.role as 'farmer' | 'retailer',
        location: formData.location, password: formData.password,
        confirmPassword: formData.confirmPassword,
      })
      toast.success('Account created! Redirecting...')
      const stored = localStorage.getItem('user')
      const role = stored ? JSON.parse(stored).role : null
      router.push(role === 'retailer' ? '/dashboard/retailer' : '/dashboard/farmer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const strengthColor = { weak: 'bg-red-500', medium: 'bg-yellow-500', strong: 'bg-green-500' }
  const strengthWidth = { weak: 'w-1/3', medium: 'w-2/3', strong: 'w-full' }
  const strengthText = { weak: 'text-red-500', medium: 'text-yellow-600', strong: 'text-green-600' }

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── Left panel ── */}
      <div className={`hidden lg:flex lg:w-5/12 bg-green-700 flex-col justify-between p-12 relative overflow-hidden
        transition-all duration-700 ease-out
        ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
      >
        {/* Background circles */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute rounded-full border-2 border-white"
              style={{ width: `${(i+1)*130}px`, height: `${(i+1)*130}px`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
          ))}
        </div>

        {/* Logo */}
        <div className={`relative z-10 transition-all duration-700 delay-200 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h1 className="text-3xl font-bold text-white tracking-tight">🌾 AgroGebeya</h1>
          <p className="text-green-200 mt-1 text-sm">Ethiopia's Agricultural Marketplace</p>
        </div>

        {/* Headline + stats */}
        <div className="relative z-10 space-y-8">
          <div className={`transition-all duration-700 delay-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="text-white text-2xl font-bold leading-snug">
              Join 13,000+ Farmers<br />& Retailers Today
            </h2>
            <p className="text-green-200 mt-3 text-sm leading-relaxed max-w-sm">
              AgroGebeya is Ethiopia's fastest-growing agricultural marketplace. Create your free account and start trading in minutes.
            </p>
            {/* Stats row */}
            <div className="flex gap-6 mt-5">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-white font-bold text-lg">{value}</p>
                  <p className="text-green-300 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map(({ icon, title, desc }, i) => (
              <div key={title}
                className={`flex items-start gap-3 transition-all duration-500 ease-out
                  ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                style={{ transitionDelay: `${400 + i * 100}ms` }}
              >
                <span className="text-lg mt-0.5 flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-green-200 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '950ms' }}>
          <p className="text-green-300 text-xs">Free to join. No hidden fees. Start trading today.</p>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className={`flex-1 flex flex-col items-center justify-center px-6 py-10 bg-background overflow-y-auto
        transition-all duration-700 ease-out
        ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      >
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">🌾 AgroGebeya</h1>
            <p className="text-muted-foreground text-sm">Ethiopia's Agricultural Marketplace</p>
          </div>

          <div className={`mb-6 transition-all duration-700 delay-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Back to Home
            </Link>
            <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
            <p className="text-muted-foreground text-sm mt-1">Free forever. No credit card required.</p>
          </div>

          <div className={`bg-card rounded-xl shadow-sm p-8 border border-border
            transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '400ms' }}
          >
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Role selector — prominent at top */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                {(['farmer', 'retailer'] as const).map(r => (
                  <button key={r} type="button"
                    onClick={() => setFormData(p => ({ ...p, role: r }))}
                    className={`py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.role === r
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {r === 'farmer' ? '🌱 Farmer / Supplier' : '🛒 Retailer / Buyer'}
                  </button>
                ))}
              </div>

              {/* Two-column: name + phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input id="name" name="name" type="text" placeholder="Abebe Girma" value={formData.name}
                      onChange={handleChange} className="pl-9" disabled={isLoading} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input id="phone" name="phone" type="tel" placeholder="+251 9XX XXXXXX" value={formData.phone}
                      onChange={handleChange} className="pl-9" disabled={isLoading} required />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email}
                    onChange={handleChange} className="pl-9" disabled={isLoading} required />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Location / Region</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="location" name="location" type="text" placeholder="e.g., Addis Ababa, Oromia" value={formData.location}
                    onChange={handleChange} className="pl-9" disabled={isLoading} required />
                </div>
              </div>

              {/* Password row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                      value={formData.password} onChange={handleChange} className="pl-9 pr-9" disabled={isLoading} required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {strength && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-muted rounded h-1 overflow-hidden">
                        <div className={`h-full transition-all ${strengthWidth[strength as keyof typeof strengthWidth]} ${strengthColor[strength as keyof typeof strengthColor]}`} />
                      </div>
                      <span className={`text-xs font-medium ${strengthText[strength as keyof typeof strengthText]}`}>{strength}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input id="confirmPassword" name="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="••••••••"
                      value={formData.confirmPassword} onChange={handleChange} className="pl-9 pr-9" disabled={isLoading} required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <p className={`text-xs mt-1 ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                      {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input id="agreeToTerms" type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms}
                  onChange={handleChange} className="w-4 h-4 accent-primary mt-0.5 flex-shrink-0" disabled={isLoading} />
                <span className="text-sm text-muted-foreground">
                  I agree to the{' '}
                  <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </span>
              </label>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-5 text-center border-t border-border pt-5">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
