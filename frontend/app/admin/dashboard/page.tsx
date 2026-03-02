'use client'

import React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'
import {
  Users,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Package,
  DollarSign,
  Truck,
  Activity,
} from 'lucide-react'
import Link from 'next/link'

interface StatCard {
  title: string
  value: string | number
  change: string
  icon: React.ReactNode
  color: string
}

export default function AdminDashboardPage() {
  const stats: StatCard[] = [
    {
      title: 'Total Users',
      value: '2,847',
      change: '+12% this month',
      icon: <Users className="h-6 w-6" />,
      color: 'text-blue-600',
    },
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+23% vs last month',
      icon: <ShoppingCart className="h-6 w-6" />,
      color: 'text-green-600',
    },
    {
      title: 'Revenue',
      value: '৳2.8M',
      change: '+18% growth',
      icon: <DollarSign className="h-6 w-6" />,
      color: 'text-yellow-600',
    },
    {
      title: 'Active Shipments',
      value: '145',
      change: '28 delivered today',
      icon: <Truck className="h-6 w-6" />,
      color: 'text-orange-600',
    },
  ]

  const recentOrders = [
    { id: 'ORD-001847', user: 'Addis Ababa Agro', amount: '৳45,250', status: 'Delivered', date: 'Jan 20' },
    { id: 'ORD-001846', user: 'Dire Dawa Trading', amount: '৳32,500', status: 'In Transit', date: 'Jan 19' },
    { id: 'ORD-001845', user: 'Hawassa Market', amount: '৳15,800', status: 'Pending', date: 'Jan 18' },
    { id: 'ORD-001844', user: 'Mekelle Wholesale', amount: '৳58,900', status: 'Delivered', date: 'Jan 17' },
  ]

  const topProducts = [
    { name: 'Teff Flour', sales: 487, revenue: '৳219,150' },
    { name: 'Wheat', sales: 342, revenue: '৳232,560' },
    { name: 'Maize', sales: 298, revenue: '৳113,240' },
    { name: 'Barley', sales: 215, revenue: '৳111,800' },
    { name: 'Fertilizer NPK', sales: 156, revenue: '৳187,200' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800'
      case 'In Transit':
        return 'bg-orange-100 text-orange-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Platform overview and key metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 bg-gray-100 dark:bg-gray-800 rounded-lg ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-foreground mb-2">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest order activity</CardDescription>
                </div>
                <Link href="/admin/orders" className="text-sm text-primary hover:underline">
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
                    <div>
                      <p className="font-medium text-foreground text-sm">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.user}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium text-foreground text-sm">{order.amount}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <p className="text-xs text-muted-foreground w-12">{order.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-100 text-sm">Low Stock Alert</p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">3 products below minimum threshold</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex gap-3">
                  <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">Pending Verification</p>
                    <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">12 new retailers waiting approval</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex gap-3">
                  <Activity className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100 text-sm">System Performance</p>
                    <p className="text-xs text-red-800 dark:text-red-200 mt-1">API response time above 500ms</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling products this month</CardDescription>
              </div>
              <Link href="/admin/products" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Product Name</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Sales</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{product.name}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="text-foreground">{product.sales}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-medium text-foreground">{product.revenue}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
