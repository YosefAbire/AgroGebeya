'use client'

import { ArrowRight, Users, TrendingUp, Zap, Globe, Shield, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Connect Farmers & Retailers Directly
          </h1>
          <p className="text-lg text-muted-foreground mt-2">Farmers and Retailers Direct Connection</p>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground">
            AgroGebeya is Ethiopia's agricultural marketplace that eliminates intermediaries, reduces costs, and brings fresh produce directly from farms to retailers across all regions—from Addis Ababa to Dire Dawa, Mekelle to Hawassa.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/products"
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Browse Products
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-primary px-8 py-4 text-lg font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-secondary/50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Why Choose AgroGebeya?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Supporting Ethiopia's agricultural growth through transparency, fair pricing, and direct connections between farmers and retailers
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: 'Direct Connection',
                description: 'Connect directly with farmers and retailers. No middlemen, no unnecessary costs. Eliminate traditional market chains.',
              },
              {
                icon: TrendingUp,
                title: 'Fair Prices',
                description: 'Fair prices in Ethiopian Birr (ETB). Farmers earn more from Addis Ababa to Hawassa. Retailers pay less.',
              },
              {
                icon: Zap,
                title: 'Real-Time Updates',
                description: 'Real-time access to tomatoes, onions, potatoes, and all Ethiopian agricultural products with instant pricing updates.',
              },
              {
                icon: Globe,
                title: 'Wide Coverage',
                description: 'Reach markets across all Ethiopian regions: Oromia, Amhara, SNNPR, Tigray, Dire Dawa, and beyond.',
              },
              {
                icon: Shield,
                title: 'Secure Transactions',
                description: 'Safe payments and protected transactions for farmers and retailers in every region of Ethiopia.',
              },
              {
                icon: BarChart3,
                title: 'Business Analytics',
                description: 'Track sales, monitor trends across all markets, and make data-driven business decisions.',
              },
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-card p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Farmer & Retailer Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 sm:py-20">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          For Farmers and Retailers
        </h2>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* For Farmers */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h3 className="text-2xl font-bold text-foreground">For Farmers</h3>
            <ul className="mt-6 space-y-4">
              {[
                'List tomatoes, onions, potatoes and reach retailers nationwide',
                'Set your own prices in Ethiopian Birr (ETB)',
                'Manage orders and track earnings in real-time',
                'Access reliable buyer network across all regions',
                'Reduce dependency on middlemen and suppliers',
                'Build long-term business relationships with retailers',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1 text-primary font-bold">✓</span>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/products/new"
              className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Selling Today
            </Link>
          </div>

          {/* For Retailers */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h3 className="text-2xl font-bold text-foreground">For Retailers</h3>
            <ul className="mt-6 space-y-4">
              {[
                'Browse thousands of fresh products from Ethiopian farmers',
                'Compare prices in ETB from multiple farmers',
                'Place bulk orders of vegetables, fruits, and grains easily',
                'Track orders in real-time from market to delivery',
                'Access quality certified products from all Ethiopian regions',
                'Manage inventory efficiently across your locations',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1 text-accent font-bold">✓</span>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/products"
              className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-border bg-secondary/50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
            {[
              { number: '50K+', label: 'Active Farmers & Retailers' },
              { number: '10K+', label: 'Products Listed' },
              { number: '100K+', label: 'Orders Completed' },
              { number: '10+', label: 'Ethiopian Regions' },
            ].map((stat, index) => (
              <div key={index}>
                <p className="text-4xl font-bold text-primary sm:text-5xl">{stat.number}</p>
                <p className="mt-2 text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 sm:py-20">
        <div className="rounded-lg border border-border bg-primary/5 p-8 sm:p-12 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Ready to Get Started?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Join thousands of farmers and retailers from Addis Ababa to Hawassa, transforming Ethiopia's agricultural market
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/products"
              className="rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Browse Products
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-primary px-8 py-3 font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  AG
                </div>
                AgroGebeya
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Connecting farmers and retailers for sustainable agricultural growth across Ethiopia.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground">Products</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/products" className="hover:text-primary transition-colors">Browse Products</Link></li>
                <li><Link href="/orders" className="hover:text-primary transition-colors">Orders</Link></li>
                <li><Link href="/inventory" className="hover:text-primary transition-colors">Inventory</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground">Company</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-primary transition-colors">Terms</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-primary transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 AgroGebeya. All rights reserved. Transforming Ethiopia's agricultural market.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
