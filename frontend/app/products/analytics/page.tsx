'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Eye, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProductAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')

  const analyticsData = {
    topProducts: [
      { name: 'Red Bell Peppers', sales: 425, revenue: 255000, trend: 'up' },
      { name: 'Organic Tomatoes', sales: 342, revenue: 153900, trend: 'up' },
      { name: 'Wheat Grain', sales: 287, revenue: 344400, trend: 'down' },
      { name: 'Fresh Lettuce', sales: 198, revenue: 55440, trend: 'up' },
      { name: 'White Onions', sales: 156, revenue: 49920, trend: 'stable' },
    ],
    categoryBreakdown: [
      { category: 'Vegetables', percentage: 65, sales: 1208 },
      { category: 'Grains', percentage: 25, sales: 287 },
      { category: 'Fruits', percentage: 8, sales: 95 },
      { category: 'Herbs', percentage: 2, sales: 20 },
    ],
    metrics: {
      totalSales: 1610,
      totalRevenue: 859260,
      avgOrderValue: 534,
      conversionRate: 3.2,
    },
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Page Title and Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Product Analytics</h1>
              <p className="text-muted-foreground">Track sales, revenue, and performance metrics</p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 rounded-md bg-card border border-border text-foreground focus:border-primary outline-none transition-colors"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-muted-foreground text-sm mb-2">Total Sales</p>
              <p className="text-3xl font-bold text-primary mb-2">{analyticsData.metrics.totalSales.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5% from last period</span>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-muted-foreground text-sm mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-primary mb-2">ETB {(analyticsData.metrics.totalRevenue / 1000).toFixed(0)}K</p>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+18.3% from last period</span>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-muted-foreground text-sm mb-2">Avg Order Value</p>
              <p className="text-3xl font-bold text-primary mb-2">ETB {analyticsData.metrics.avgOrderValue.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <TrendingDown className="w-4 h-4" />
                <span>-2.1% from last period</span>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-muted-foreground text-sm mb-2">Conversion Rate</p>
              <p className="text-3xl font-bold text-primary mb-2">{analyticsData.metrics.conversionRate}%</p>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+0.8% from last period</span>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Top Performing Products</h2>
            <div className="space-y-4">
              {analyticsData.topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-primary w-8">{idx + 1}</span>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <div className="flex items-center gap-6 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="w-4 h-4" />
                            {product.sales} sales
                          </span>
                          <span>ETB {product.revenue.toLocaleString()} revenue</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 font-medium ${product.trend === 'up' ? 'text-green-600' : product.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                    {product.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                    {product.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                    <span>{product.trend === 'stable' ? 'Stable' : product.trend === 'up' ? '+15%' : '-8%'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Sales by Category</h2>
              <div className="space-y-6">
                {analyticsData.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{cat.category}</p>
                      <p className="text-sm text-muted-foreground">{cat.sales} sales</p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-accent h-full transition-all"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{cat.percentage}% of total</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Performance Insights</h2>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-medium text-green-900 mb-1">Best Performer</p>
                  <p className="text-sm text-green-800">Red Bell Peppers with 425 sales and highest revenue generation</p>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="font-medium text-orange-900 mb-1">Needs Attention</p>
                  <p className="text-sm text-orange-800">White Onions have lower sales - consider price adjustment or promotion</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium text-blue-900 mb-1">Growth Opportunity</p>
                  <p className="text-sm text-blue-800">Vegetables category dominates with 65% - expand vegetable product line</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="font-medium text-purple-900 mb-1">Recommendation</p>
                  <p className="text-sm text-purple-800">Bundle high-performing products with low sellers to boost overall sales</p>
                </div>
              </div>
            </div>
          </div>

          {/* Export and Actions */}
          <div className="flex gap-4">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Export Report as PDF
            </Button>
            <Button variant="outline">
              Export as CSV
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
