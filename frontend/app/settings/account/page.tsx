'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Eye, EyeOff, LogOut, Shield, Bell, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState('password')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    orderUpdates: true,
    marketingEmails: false,
    pushNotifications: true,
  })

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSavedMessage('Password changed successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSavedMessage(''), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }))
  }

  const handleSaveNotifications = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSavedMessage('Notification preferences updated!')
      setTimeout(() => setSavedMessage(''), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
            <p className="text-muted-foreground">Manage your security and notification preferences</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-border">
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'password'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="w-4 h-4 inline-block mr-2" />
              Password
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="w-4 h-4 inline-block mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'notifications'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bell className="w-4 h-4 inline-block mr-2" />
              Notifications
            </button>
          </div>

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Change Password</h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                {/* Current Password */}
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
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

                {/* New Password */}
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="pl-10 pr-10 bg-secondary/50 border-border focus:border-primary"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="pl-10 bg-secondary/50 border-border focus:border-primary"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-secondary/50 rounded p-4 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Password requirements:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>At least 8 characters</li>
                    <li>Contains uppercase and lowercase letters</li>
                    <li>Contains at least one number</li>
                  </ul>
                </div>

                {/* Success Message */}
                {savedMessage && (
                  <div className="bg-green-50 border border-green-200 rounded text-green-700 text-sm p-3">
                    {savedMessage}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h2>
                    <p className="text-sm text-muted-foreground mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                      twoFactorEnabled ? 'bg-primary' : 'bg-secondary'
                    }`}>
                      <input
                        type="checkbox"
                        checked={twoFactorEnabled}
                        onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                        className="sr-only"
                      />
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        twoFactorEnabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {twoFactorEnabled
                    ? 'Two-factor authentication is enabled. You will need to verify your identity on your phone when signing in.'
                    : 'Enable this feature to require a verification code when you sign in from a new device.'}
                </p>
              </div>

              {/* Active Sessions */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Active Sessions</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Current Browser</p>
                        <p className="text-xs text-muted-foreground">Chrome on macOS • Last active now</p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    Sign out all other sessions
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Notification Preferences</h2>
              <div className="space-y-4 max-w-md">
                {/* Email Notifications */}
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                  <input
                    type="checkbox"
                    checked={notifications.emailNotifications}
                    onChange={() => handleNotificationChange('emailNotifications')}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Get notified about important updates</p>
                  </div>
                </label>

                {/* Order Updates */}
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                  <input
                    type="checkbox"
                    checked={notifications.orderUpdates}
                    onChange={() => handleNotificationChange('orderUpdates')}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Order Updates</p>
                    <p className="text-xs text-muted-foreground">Receive updates on your orders</p>
                  </div>
                </label>

                {/* Push Notifications */}
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                  <input
                    type="checkbox"
                    checked={notifications.pushNotifications}
                    onChange={() => handleNotificationChange('pushNotifications')}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Browser notifications for time-sensitive updates</p>
                  </div>
                </label>

                {/* Marketing Emails */}
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                  <input
                    type="checkbox"
                    checked={notifications.marketingEmails}
                    onChange={() => handleNotificationChange('marketingEmails')}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Marketing Emails</p>
                    <p className="text-xs text-muted-foreground">Receive news and special offers</p>
                  </div>
                </label>

                {/* Success Message */}
                {savedMessage && (
                  <div className="bg-green-50 border border-green-200 rounded text-green-700 text-sm p-3">
                    {savedMessage}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSaveNotifications}
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Sign Out</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Sign out of your account on this device
            </p>
            <Button variant="outline" className="gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
