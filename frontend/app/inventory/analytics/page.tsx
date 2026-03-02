'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'

export default function InventoryAnalyticsPage() {
  const analyticsData = [
    { month: 'Jan', restocks: 12, sales: 28, returns: 3 },
    { month: 'Feb', restocks: 15, sales: 32, returns: 2 },
    { month: 'Mar', restocks: 10, sales: 25, returns: 4 },
    { month: 'Apr', restocks: 18, sales: 35, returns: 3 },
    { month: 'May', restocks: 14, sales: 30, returns: 2 },
    { month: 'Jun', restocks: 20, sales: 40, returns: 5 },
  ]

  const topProducts = [
    { name: 'Teff Flour', movements: 145, trend: 'up' },
    { name: 'Wheat', movements: 118, trend: 'down' },
    { name: 'Maize', movements: 98, trend: 'up' },
    { name: 'Barley', movements: 87, trend: 'up' },
    { name: 'Fertilizer NPK', movements: 62, trend: 'down' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Inventory Analytics</h1>
          <p className="text-muted-foreground mt-2">Insights into your inventory movements and trends</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Movements</p>
              <p className="text-3xl font-bold text-foreground">847</p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Avg. Stock Turnover</p>
              <p className="text-3xl font-bold text-foreground">14.2</p>
              <p className="text-xs text-muted-foreground mt-2">days</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Slow Moving Items</p>
              <p className="text-3xl font-bold text-yellow-600">2</p>
              <p className="text-xs text-muted-foreground mt-2">products</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Inventory Value</p>
              <p className="text-3xl font-bold text-foreground">৳245K</p>
              <p className="text-xs text-muted-foreground mt-2">estimated</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Activity</CardTitle>
              <CardDescription>Monthly inventory movements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium text-foreground">{item.month}</span>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Restocks</p>
                        <p className="font-medium text-foreground">{item.restocks}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sales</p>
                        <p className="font-medium text-green-600">{item.sales}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Returns</p>
                        <p className="font-medium text-orange-600">{item.returns}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Moving Products</CardTitle>
              <CardDescription>Products with highest inventory movements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.movements} movements</p>
                    </div>
                    <div className={product.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {product.trend === 'up' ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Report */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generate Reports</CardTitle>
            <CardDescription>Export inventory data for analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Calendar className="h-4 w-4" />
                Daily Report
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Calendar className="h-4 w-4" />
                Weekly Report
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Calendar className="h-4 w-4" />
                Monthly Report
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
