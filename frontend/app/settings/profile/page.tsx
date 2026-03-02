'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, MapPin, Save, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+251 911 234567',
    role: 'Farmer',
    location: 'Addis Ababa, Oromia',
    bio: 'Dedicated to sustainable agriculture and quality produce',
    farmSize: '5 hectares',
    specializations: 'Vegetables, Grains',
    website: 'www.johndoe-farm.com',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
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
          {/* Profile Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account information and preferences</p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Profile Picture</h2>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <div className="flex-1">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                    <Upload className="w-4 h-4" />
                    Upload New Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max size 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Personal Information</h2>
              <div className="space-y-4">
                {/* Name */}
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
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10 bg-secondary/50 border-border focus:border-primary"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email */}
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
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 bg-secondary/50 border-border focus:border-primary"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Phone */}
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
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10 bg-secondary/50 border-border focus:border-primary"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label htmlFor="location" className="block text-sm font-medium text-foreground">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleChange}
                      className="pl-10 bg-secondary/50 border-border focus:border-primary"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Business Information</h2>
              <div className="space-y-4">
                {/* Role */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Account Type
                  </label>
                  <div className="px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground">
                    {formData.role}
                  </div>
                </div>

                {/* Farm Size */}
                <div className="space-y-2">
                  <label htmlFor="farmSize" className="block text-sm font-medium text-foreground">
                    Farm Size / Business Area
                  </label>
                  <Input
                    id="farmSize"
                    name="farmSize"
                    type="text"
                    value={formData.farmSize}
                    onChange={handleChange}
                    className="bg-secondary/50 border-border focus:border-primary"
                    disabled={isLoading}
                  />
                </div>

                {/* Specializations */}
                <div className="space-y-2">
                  <label htmlFor="specializations" className="block text-sm font-medium text-foreground">
                    Specializations
                  </label>
                  <Input
                    id="specializations"
                    name="specializations"
                    type="text"
                    placeholder="e.g., Vegetables, Grains, Fruits"
                    value={formData.specializations}
                    onChange={handleChange}
                    className="bg-secondary/50 border-border focus:border-primary"
                    disabled={isLoading}
                  />
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <label htmlFor="website" className="block text-sm font-medium text-foreground">
                    Website (Optional)
                  </label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={handleChange}
                    className="bg-secondary/50 border-border focus:border-primary"
                    disabled={isLoading}
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-foreground">
                    About You
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about your farm or business..."
                    className="w-full px-4 py-2 rounded-md bg-secondary/50 border border-border text-foreground focus:border-primary outline-none transition-colors resize-none"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Save Status */}
            {isSaved && (
              <div className="bg-green-50 border border-green-200 rounded text-green-700 text-sm p-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Profile updated successfully!
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="destructive">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { CheckCircle2 } from 'lucide-react'
