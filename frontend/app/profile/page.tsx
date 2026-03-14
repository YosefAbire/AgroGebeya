'use client'

import React, { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Edit2, Save, User } from 'lucide-react'
import Header from '@/components/Header'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { api } from '@/lib/api'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'

export default function ProfilePage() {
  const { user, token, isLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      await api.put('/api/v1/auth/me', formData, token)
      setSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8"><LoadingSkeleton type="form" count={5} /></main>
      </div>
    )
  }

  const displayName = formData.full_name || user?.username || 'User'

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="mt-1 text-muted-foreground">Manage your account information</p>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isEditing ? <><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}</> : <><Edit2 className="h-4 w-4" />Edit Profile</>}
          </button>
        </div>

        {success && <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">Profile updated successfully.</div>}
        {error && <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <User className="h-12 w-12 text-primary" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">{displayName}</h2>
              <p className="mt-1 text-muted-foreground capitalize">{user?.role}</p>
              <div className="mt-6 w-full space-y-3 border-t border-border pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{formData.email || 'No email'}</span>
                </div>
                {formData.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{formData.phone}</span>
                  </div>
                )}
                {formData.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{formData.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-foreground">Full Name</label>
                  <input id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleChange} disabled={!isEditing}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">Email</label>
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={!isEditing}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground">Phone</label>
                  <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={!isEditing}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-foreground">Location</label>
                  <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} disabled={!isEditing}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link href="/settings/account" className="rounded-lg border border-border bg-card px-4 py-3 text-center font-medium text-foreground hover:bg-secondary transition-colors">
                Account Settings
              </Link>
              <button className="rounded-lg border border-destructive bg-card px-4 py-3 text-center font-medium text-destructive hover:bg-destructive/10 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
