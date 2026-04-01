'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Eye, EyeOff, LogOut, Shield, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

const TABS = [
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function AccountSettingsPage() {
  const { token, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('password')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [notifications, setNotifications] = useState({
    emailNotifications: true, orderUpdates: true, marketingEmails: false, pushNotifications: true,
  })

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!passwordData.currentPassword) { setMessage({ text: 'Current password is required.', type: 'error' }); return }
    if (!passwordData.newPassword) { setMessage({ text: 'New password is required.', type: 'error' }); return }
    if (passwordData.newPassword !== passwordData.confirmPassword) { setMessage({ text: 'New passwords do not match.', type: 'error' }); return }
    if (passwordData.newPassword.length < 8) { setMessage({ text: 'Password must be at least 8 characters.', type: 'error' }); return }
    setIsLoading(true)
    setMessage(null)
    try {
      await api.post('/api/v1/auth/change-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      }, token)
      setMessage({ text: 'Password changed successfully.', type: 'success' })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to change password.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
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

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your security and notification preferences</p>
        </div>

        {/* Tabs — scrollable on mobile */}
        <div className="flex gap-1 border-b border-border overflow-x-auto scrollbar-none -mx-4 px-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* Password tab */}
        {activeTab === 'password' && (
          <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
            <h2 className="text-base font-semibold text-foreground mb-5">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="currentPassword" name="currentPassword" type={showCurrent ? 'text' : 'password'} autoComplete="current-password" value={passwordData.currentPassword} onChange={handlePasswordChange} className="pl-9 pr-10" disabled={isLoading} required />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="newPassword" name="newPassword" type={showNew ? 'text' : 'password'} autoComplete="new-password" value={passwordData.newPassword} onChange={handlePasswordChange} className="pl-9 pr-10" disabled={isLoading} required />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="pl-9" disabled={isLoading} required />
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Requirements:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>At least 8 characters</li>
                  <li>Mix of uppercase and lowercase</li>
                  <li>At least one number</li>
                </ul>
              </div>

              {message && (
                <div className={`rounded-lg text-sm p-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-destructive/10 border border-destructive/20 text-destructive'}`}>
                  {message.text}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </div>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
            <h2 className="text-base font-semibold text-foreground mb-2">Security Settings</h2>
            <p className="text-sm text-muted-foreground">Two-factor authentication and session management coming soon.</p>
          </div>
        )}

        {/* Notifications tab */}
        {activeTab === 'notifications' && (
          <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
            <h2 className="text-base font-semibold text-foreground mb-5">Notification Preferences</h2>
            <div className="space-y-2">
              {Object.entries(notifications).map(([key, val]) => (
                <label key={key} className="flex items-center justify-between gap-3 cursor-pointer p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                  <p className="text-sm font-medium text-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <input
                    id={`notif-${key}`}
                    name={key}
                    type="checkbox"
                    checked={val}
                    onChange={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                    className="w-4 h-4 rounded accent-primary flex-shrink-0"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
          <h2 className="text-base font-semibold text-foreground mb-1">Sign Out</h2>
          <p className="text-sm text-muted-foreground mb-4">Sign out of your account on this device.</p>
          <Button variant="outline" onClick={handleLogout} className="gap-2 w-full sm:w-auto">
            <LogOut className="w-4 h-4" />Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
