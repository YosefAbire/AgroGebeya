'use client';

import { useCallback, useEffect, useState } from 'react'

export interface User {
  id?: string
  name: string
  full_name?: string
  username?: string
  email: string
  phone?: string
  role: 'farmer' | 'retailer' | 'admin'
  location?: string
  avatar?: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (userData: Partial<User> & { password: string; confirmPassword: string }) => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

/**
 * Hook for managing authentication state
 * Provides login, logout, register, and profile update functionality
 */
export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user')
        const storedToken = localStorage.getItem('token')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
        if (storedToken) {
          setToken(storedToken)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Call real backend login endpoint
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email, // Backend expects username field
          password: password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Invalid credentials')
      }

      const data = await response.json()
      const accessToken = data.access_token

      // Get user details with the token
      const userResponse = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!userResponse.ok) {
        throw new Error('Failed to get user details')
      }

      const userData = await userResponse.json()

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', accessToken)
      
      setUser(userData)
      setToken(accessToken)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      localStorage.removeItem('user')
      localStorage.removeItem('token')
      setUser(null)
      setToken(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(
    async (userData: Partial<User> & { password: string; confirmPassword: string }) => {
      setIsLoading(true)
      try {
        // Validate input
        if (!userData.name || !userData.email) {
          throw new Error('Name and email are required')
        }

        if (userData.password !== userData.confirmPassword) {
          throw new Error('Passwords do not match')
        }

        if (userData.password && userData.password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }

        // Call real backend register endpoint
        const response = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userData.email,
            username: userData.name.toLowerCase().replace(/\s+/g, '_'),
            password: userData.password,
            full_name: userData.name,
            phone: userData.phone,
            role: userData.role || 'farmer',
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || 'Registration failed')
        }

        // Auto-login after registration
        await login(userData.name.toLowerCase().replace(/\s+/g, '_'), userData.password)
      } catch (error) {
        console.error('Registration error:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [login]
  )

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))

      if (!user) {
        throw new Error('User not authenticated')
      }

      const updatedUser = { ...user, ...updates }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  return {
    user,
    token,
    loading: isLoading,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    updateProfile,
  }
}
