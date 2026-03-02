'use client'

import { Menu, X, User, LogOut, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NotificationBell } from './notifications/NotificationBell'

interface UserData {
  id: string
  name: string
  email: string
  role: string
}

export default function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const authToken = localStorage.getItem('token')
    
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.log('[v0] Error parsing user data:', error)
      }
    }
    
    if (authToken) {
      setToken(authToken)
    }
  }, [])

  const handleLogout = () => {
    setProfileMenuOpen(false)
    router.push('/auth/logout')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              AG
            </div>
            <span className="hidden text-xl font-bold text-foreground sm:inline">AgroGebeya</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden gap-8 md:flex">
            <Link href="/dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/products" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Products
            </Link>
            <Link href="/orders" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Orders
            </Link>
            <Link href="/inventory" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Inventory
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {user && token ? (
              <>
                {/* Notifications - Only for logged in users */}
                <div className="hidden sm:block">
                  <NotificationBell token={token} />
                </div>

                {/* Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="rounded-lg p-2 hover:bg-secondary"
                    aria-label="Profile menu"
                  >
                    <User className="h-5 w-5 text-foreground" />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-secondary"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          My Profile
                        </div>
                      </Link>
                      <Link
                        href="/settings/account"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-secondary"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Settings
                        </div>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary rounded-b-lg flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Login/Register Links - Only for non-logged in users */}
                <Link
                  href="/auth/login"
                  className="hidden text-sm font-medium text-foreground hover:text-primary transition-colors sm:inline"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Register
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 hover:bg-secondary md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="border-t border-border py-4 md:hidden">
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="rounded px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Dashboard
              </Link>
              <Link
                href="/products"
                className="rounded px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Products
              </Link>
              <Link
                href="/orders"
                className="rounded px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Orders
              </Link>
              <Link
                href="/inventory"
                className="rounded px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Inventory
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
