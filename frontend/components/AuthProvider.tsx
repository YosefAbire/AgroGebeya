'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '@/lib/auth-service'
import { User as ApiUser, UserRole } from '@/lib/types'

export interface User {
  id: number
  name: string
  email: string
  username: string
  phone?: string
  role: 'farmer' | 'retailer' | 'admin'
  location?: string
  avatar?: string
  is_verified: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  refreshUser: () => Promise<void>
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapApiUserToUser(apiUser: ApiUser): User {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
  const profileImg = (apiUser as any).profile_image_url
  return {
    id: apiUser.id,
    name: apiUser.full_name || apiUser.username,
    email: apiUser.email,
    username: apiUser.username,
    phone: apiUser.phone,
    role: apiUser.role as 'farmer' | 'retailer' | 'admin',
    is_verified: apiUser.is_verified,
    avatar: profileImg
      ? (profileImg.startsWith('http') ? profileImg : `${API_BASE}${profileImg}`)
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiUser.username}`,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = authService.getToken()
        
        if (storedToken) {
          setToken(storedToken)
          // Fetch current user from backend
          const apiUser = await authService.getCurrentUser(storedToken)
          setUser(mapApiUserToUser(apiUser))
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        authService.removeToken()
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      // Call backend API
      const authResponse = await authService.login({ username, password })
      setToken(authResponse.access_token)
      
      // Fetch user data
      const apiUser = await authService.getCurrentUser(authResponse.access_token)
      setUser(mapApiUserToUser(apiUser))
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      authService.logout()
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
    }
  }

  const refreshUser = async () => {
    const currentToken = token || authService.getToken()
    if (!currentToken) return
    try {
      const apiUser = await authService.getCurrentUser(currentToken)
      setUser(mapApiUserToUser(apiUser))
    } catch {}
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
