'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, MapPin, Save, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { api } from '@/lib/api'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'

export default function ProfileSettingsPage() {
  const { user, token, isLoading } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', location: '', bio: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: '',
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      await api.put('/api/v1/auth/me', formData, token)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background max-w-4xl mx-auto px-4 py-8">
        <LoadingSkeleton type="form" count={5} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profile photo upload coming soon.</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max size 5MB</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
            <div className="space-y-2">
              <label htmlFor="full_name" className="block text-sm font-medium text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} className="pl-10" disabled={saving} />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="pl-10" disabled={saving} />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-foreground">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="pl-10" disabled={saving} />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-foreground">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input id="location" name="location" value={formData.location} onChange={handleChange} className="pl-10" disabled={saving} />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="bio" className="block text-sm font-medium text-foreground">About You</label>
              <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows={4} disabled={saving}
                className="w-full px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground focus:border-primary outline-none resize-none" />
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Account Type</h2>
            <div className="px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground capitalize">
              {user?.role || 'Unknown'}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && (
            <div className="bg-green-50 border border-green-200 rounded text-green-700 text-sm p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />Profile updated successfully.
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
          </div>
        </form>

        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back.</p>
          <Button variant="destructive">Delete Account</Button>
        </div>
      </div>
    </div>
  )
}
