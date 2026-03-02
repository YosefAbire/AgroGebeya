'use client'

import React from "react"

import { Mail, Phone, MapPin, Edit2, Save, X } from 'lucide-react'
import { useState } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@farmexample.com',
    phone: '+251911234567',
    location: 'Addis Ababa',
    farmName: 'John Doe Farm',
    farmSize: '5',
    cropsGrown: 'Tomatoes, Onions, Potatoes',
    businessLicense: 'LIC-2024-0001',
    bio: 'A dedicated farmer with 10 years of experience in agricultural production. Specialized in vegetable farming with sustainable practices.',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = () => {
    setIsEditing(false)
    console.log('Profile updated:', formData)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="mt-1 text-muted-foreground">Manage your account information and preferences</p>
          </div>
          <button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </>
            )}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-4xl">
                👨‍🌾
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="mt-1 text-muted-foreground">{formData.farmName}</p>

              <div className="mt-6 w-full space-y-3 border-t border-border pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${formData.email}`} className="hover:text-primary transition-colors">
                    {formData.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${formData.phone}`} className="hover:text-primary transition-colors">
                    {formData.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {formData.location}
                </div>
              </div>

              <button className="mt-6 w-full rounded-lg border border-primary px-4 py-2 font-medium text-primary hover:bg-primary/10 transition-colors">
                Download Resume
              </button>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-foreground">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-foreground">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Farm Information */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground">Farm Information</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="farmName" className="block text-sm font-medium text-foreground">
                    Farm Name
                  </label>
                  <input
                    id="farmName"
                    name="farmName"
                    type="text"
                    value={formData.farmName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="farmSize" className="block text-sm font-medium text-foreground">
                      Farm Size (Hectares)
                    </label>
                    <input
                      id="farmSize"
                      name="farmSize"
                      type="number"
                      value={formData.farmSize}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="businessLicense" className="block text-sm font-medium text-foreground">
                      Business License
                    </label>
                    <input
                      id="businessLicense"
                      name="businessLicense"
                      type="text"
                      value={formData.businessLicense}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cropsGrown" className="block text-sm font-medium text-foreground">
                    Crops Grown
                  </label>
                  <input
                    id="cropsGrown"
                    name="cropsGrown"
                    type="text"
                    value={formData.cropsGrown}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-foreground">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:bg-secondary disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/settings"
                className="rounded-lg border border-border bg-card px-4 py-3 text-center font-medium text-foreground hover:bg-secondary transition-colors"
              >
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
