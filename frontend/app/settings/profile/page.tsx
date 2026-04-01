'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, User, Mail, Phone, MapPin, Save, Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthContext } from '@/components/AuthProvider'
import { api } from '@/lib/api'
import { uploadService } from '@/lib/services/upload-service'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { toast } from 'sonner'

export default function ProfileSettingsPage() {
  const { user, token, isLoading, refreshUser } = useAuthContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', location: '', bio: '' })

  useEffect(() => {
    if (user) {
      setFormData({ full_name: user.name || '', email: user.email || '', phone: user.phone || '', location: user.location || '', bio: '' })
      setAvatarPreview(user.avatar && !user.avatar.includes('dicebear') ? user.avatar : null)
    }
  }, [user])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    const prevPreview = avatarPreview
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    try {
      await uploadService.uploadProfileImage(file, token)
      await refreshUser()
      toast.success('Profile photo updated!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo')
      setAvatarPreview(prevPreview)
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    if (!token) return
    setUploadingAvatar(true)
    try {
      await uploadService.deleteProfileImage(token)
      setAvatarPreview(null)
      await refreshUser()
      toast.success('Profile photo removed')
    } catch {
      toast.error('Failed to remove photo')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      await api.put('/api/v1/auth/me', { full_name: formData.full_name, phone: formData.phone }, token)
      await refreshUser()
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background max-w-2xl mx-auto px-4 py-8">
        <LoadingSkeleton type="form" count={5} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account information</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Avatar */}
          <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">Profile Picture</h2>
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Profile" width={80} height={80} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <User className="w-10 h-10 text-primary" />
                  )}
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:bg-primary/90 transition-colors"
                  disabled={uploadingAvatar}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                    {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                  {avatarPreview && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAvatar} disabled={uploadingAvatar}>
                      <X className="w-3.5 h-3.5 mr-1" />Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG or GIF — max 5 MB</p>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
          </div>

          {/* Personal info */}
          <div className="bg-card rounded-lg border border-border p-4 sm:p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Personal Information</h2>

            {[
              { id: 'full_name', label: 'Full Name', type: 'text', icon: User, autoComplete: 'name' },
              { id: 'email', label: 'Email Address', type: 'email', icon: Mail, autoComplete: 'email' },
              { id: 'phone', label: 'Phone Number', type: 'tel', icon: Phone, autoComplete: 'tel' },
              { id: 'location', label: 'Location', type: 'text', icon: MapPin, autoComplete: 'address-level2' },
            ].map(({ id, label, type, icon: Icon, autoComplete }) => (
              <div key={id} className="space-y-1.5">
                <label htmlFor={id} className="block text-sm font-medium text-foreground">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id={id} name={id} type={type} autoComplete={autoComplete}
                    value={formData[id as keyof typeof formData]}
                    onChange={handleChange}
                    className="pl-9"
                    disabled={saving}
                  />
                </div>
              </div>
            ))}

            <div className="space-y-1.5">
              <label htmlFor="bio" className="block text-sm font-medium text-foreground">About You</label>
              <textarea
                id="bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} disabled={saving}
                className="w-full px-3 py-2 rounded-md bg-secondary/50 border border-border text-foreground text-sm focus:border-primary outline-none resize-none"
              />
            </div>
          </div>

          {/* Account type */}
          <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
            <h2 className="text-base font-semibold text-foreground mb-2">Account Type</h2>
            <div className="px-3 py-2 rounded-md bg-secondary/50 border border-border text-foreground text-sm capitalize">
              {user?.role || 'Unknown'}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={saving} className="gap-2 w-full sm:w-auto">
              <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
              Cancel
            </Button>
          </div>
        </form>

        {/* Danger zone */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 sm:p-6">
          <h2 className="text-base font-semibold text-destructive mb-1">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back.</p>
          <Button variant="destructive" className="w-full sm:w-auto">Delete Account</Button>
        </div>
      </div>
    </div>
  )
}
