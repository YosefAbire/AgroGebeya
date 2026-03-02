'use client'

import { format } from 'date-fns'
import { Eye, MoreVertical } from 'lucide-react'
import { useState } from 'react'

interface Order {
  id: string
  orderNumber: string
  product: string
  quantity: number
  unit: string
  total: number
  status: 'pending' | 'approved' | 'rejected' | 'delivered'
  date: Date
  farmer?: string
  retailer?: string
}

interface OrderListProps {
  orders: Order[]
  showFarmer?: boolean
  showRetailer?: boolean
}

export default function OrderList({ orders, showFarmer = false, showRetailer = false }: OrderListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      delivered: 'bg-green-100 text-green-800',
    }
    return colors[status]
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-secondary">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Order #</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Product</th>
            <th className="px-4 py-3 text-right font-semibold text-foreground">Quantity</th>
            <th className="px-4 py-3 text-right font-semibold text-foreground">Total</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
            {showFarmer && <th className="px-4 py-3 text-left font-semibold text-foreground">Farmer</th>}
            {showRetailer && <th className="px-4 py-3 text-left font-semibold text-foreground">Retailer</th>}
            <th className="px-4 py-3 text-center font-semibold text-foreground">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-border hover:bg-secondary/50 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-foreground">{order.orderNumber}</td>
              <td className="px-4 py-3 text-foreground">{order.product}</td>
              <td className="px-4 py-3 text-right text-foreground">
                {order.quantity} {order.unit}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-foreground">
                {order.total.toLocaleString()} ETB
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3 text-foreground">{format(order.date, 'MMM dd, yyyy')}</td>
              {showFarmer && <td className="px-4 py-3 text-foreground">{order.farmer}</td>}
              {showRetailer && <td className="px-4 py-3 text-foreground">{order.retailer}</td>}
              <td className="px-4 py-3 text-center">
                <button className="inline-flex rounded-lg p-2 hover:bg-secondary" aria-label="View details">
                  <Eye className="h-4 w-4 text-foreground" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <p>No orders yet</p>
        </div>
      )}
    </div>
  )
}
