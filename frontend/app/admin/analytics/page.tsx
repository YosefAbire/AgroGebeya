'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'
import { Download, Calendar, TrendingUp, BarChart3 } from 'lucide-react'

export default function AdminAnalyticsPage() {
  const monthlyData = [
    { month: 'Jan', orders: 245, revenue: 850000, users: 124 },
    { month: 'Feb', orders: 312, revenue: 1100000, users: 156 },
    { month: 'Mar', orders: 298, revenue: 1050000, users: 142 },
    { month: 'Apr', orders: 385, revenue: 1380000, users: 189 },
    { month: 'May', orders: 421, revenue: 1520000, users: 215 },
    { month: 'Jun', orders: 510, revenue: 1850000, users: 267 },
  ]

  const userMetrics = [
    { metric: 'Total Farmers', value: '1,847', growth: '+18%' },
    { metric: 'Total Retailers', value: '385', growth: '+12%' },
    { metric: 'Admin Users', value: '12', growth: '+0%' },
    { metric: 'Pending Approval', value: '23', growth: '-5%' },
  ]

  const orderMetrics = [
    { metric: 'Total Orders', value: '2,171', growth: '+34%' },
    { metric: 'Avg Order Value', value: '৳18,500', growth: '+8%' },
    { metric: 'Completed Orders', value: '1,847', growth: '+41%' },
    { metric: 'Pending Orders', value: '324', growth: '+5%' },
  ]

  const topCategories = [
    { name: 'Grains', orders: 678, percentage: 31 },
    { name: 'Agricultural Inputs', orders: 445, percentage: 20 },
    { name: 'Seeds', orders: 389, percentage: 18 },
    { name: 'Fertilizers', orders: 334, percentage: 15 },
    { name: 'Pesticides', orders: 325, percentage: 16 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
            <p className="text-muted-foreground mt-2">Comprehensive platform analytics and insights</p>
          </div>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Generate Report
          </Button>
        </div>

        {/* User Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">User Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {userMetrics.map((metric, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground mb-2">{metric.metric}</p>
                  <p className="text-2xl font-bold text-foreground mb-2">{metric.value}</p>
                  <p className="text-xs text-green-600">{metric.growth} this month</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Order Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Order Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {orderMetrics.map((metric, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground mb-2">{metric.metric}</p>
                  <p className="text-2xl font-bold text-foreground mb-2">{metric.value}</p>
                  <p className="text-xs text-green-600">{metric.growth} this month</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Orders and revenue trends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {monthlyData.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{item.month}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{item.orders} orders</span>
                      <span className="text-sm font-medium text-foreground">৳{(item.revenue / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(item.orders / 510) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
              <CardDescription>Most ordered product categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topCategories.map((category, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{category.name}</p>
                    <span className="text-sm text-muted-foreground">{category.orders} orders</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{category.percentage}% of total</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Reports</CardTitle>
            <CardDescription>Download analytics data in various formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="outline" className="gap-2 h-12 bg-transparent">
                <BarChart3 className="h-4 w-4" />
                Export as PDF
              </Button>
              <Button variant="outline" className="gap-2 h-12 bg-transparent">
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
              <Button variant="outline" className="gap-2 h-12 bg-transparent">
                <Calendar className="h-4 w-4" />
                Schedule Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
