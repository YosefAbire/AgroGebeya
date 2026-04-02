'use client'

import { Menu, X, User, LogOut, Settings, Package, ShoppingCart, LayoutDashboard, Archive, MessageSquare, BarChart2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { NotificationBell } from './notifications/NotificationBell'
import { LanguageSwitcher } from './LanguageSwitcher'

interface UserData {
  id: string
  name: string
  email: string
  role: 'farmer' | 'retailer' | 'admin' | string
}

// Role-specific nav links
const FARMER_NAV = [
  { href: '/dashboard/farmer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products/manage', label: 'My Products', icon: Package },
  { href: '/products/new', label: 'Add Product', icon: Package },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/inventory', label: 'Inventory', icon: Archive },
  { href: '/products/analytics', label: 'Analytics', icon: BarChart2 },
]

const RETAILER_NAV = [
  { href: '/dashboard/retailer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Browse Products', icon: Package },
  { href: '/orders', label: 'My Orders', icon: ShoppingCart },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/transport', label: 'Transport', icon: Archive },
]

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const authToken = localStorage.getItem('token')
    if (userData) {
      try { setUser(JSON.parse(userData)) } catch {}
    }
    if (authToken) setToken(authToken)
  }, [])

  const handleLogout = () => {
    setProfileMenuOpen(false)
    router.push('/auth/logout')
  }

  const navLinks = user?.role === 'farmer' ? FARMER_NAV
    : user?.role === 'retailer' ? RETAILER_NAV
    : []

  const navLinkClass = (href: string) =>
    `text-sm font-medium transition-colors hover:text-primary ${
      pathname === href ? 'text-primary' : 'text-foreground'
    }`

  const mobileNavLinkClass = (href: string) =>
    `flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
      pathname === href ? 'bg-secondary text-primary' : 'text-foreground'
    }`

  // Admin uses its own sidebar layout — hide this header on /admin routes
  if (pathname?.startsWith('/admin')) return null

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              AG
            </div>
            <span className="hidden text-xl font-bold text-foreground sm:inline">AgroGebeya</span>
          </Link>

          {/* Desktop Navigation — role-filtered */}
          {navLinks.length > 0 && (
            <nav className="hidden gap-6 md:flex">
              {navLinks.map(({ href, label }) => (
                <Link key={href} href={href} className={navLinkClass(href)}>
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {user && token ? (
              <>
                <div className="hidden sm:block">
                  <NotificationBell token={token} />
                </div>

                {/* Role badge */}
                <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                  {user.role}
                </span>

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
                    <div className="absolute right-0 mt-2 w-52 rounded-lg border border-border bg-card shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                          {user.role}
                        </span>
                      </div>
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary" onClick={() => setProfileMenuOpen(false)}>
                        <User className="h-4 w-4" />My Profile
                      </Link>
                      <Link href="/settings/account" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary" onClick={() => setProfileMenuOpen(false)}>
                        <Settings className="h-4 w-4" />Settings
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-secondary rounded-b-lg">
                        <LogOut className="h-4 w-4" />Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hidden text-sm font-medium text-foreground hover:text-primary transition-colors sm:inline">
                  Login
                </Link>
                <Link href="/auth/register" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  Register
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            {navLinks.length > 0 && (
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg p-2 hover:bg-secondary md:hidden" aria-label="Toggle menu">
                {mobileMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && navLinks.length > 0 && (
          <nav className="border-t border-border py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={mobileNavLinkClass(href)} onClick={() => setMobileMenuOpen(false)}>
                  <Icon className="h-4 w-4" />{label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
