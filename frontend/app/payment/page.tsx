'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Header from '@/components/Header'
import { CreditCard, DollarSign, CheckCircle2, Clock, X } from 'lucide-react'

type PaymentMethod = 'card' | 'bank' | 'mobile' | 'cash'

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card')
  const [amount, setAmount] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, or local cards',
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: DollarSign,
      description: 'Direct bank account transfer',
    },
    {
      id: 'mobile',
      name: 'Mobile Money',
      icon: CreditCard,
      description: 'Telebirr, M-Birr, or other services',
    },
    {
      id: 'cash',
      name: 'Cash on Delivery',
      icon: DollarSign,
      description: 'Pay upon delivery',
    },
  ]

  const mockOrders = [
    { number: 'ORD-2024-001847', amount: 45250, date: 'Jan 15, 2024', status: 'pending' },
    { number: 'ORD-2024-001846', amount: 32500, date: 'Jan 10, 2024', status: 'paid' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !orderNumber) return
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Payment Management</h1>
        <p className="text-muted-foreground mb-8">Manage payments for your orders</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Make Payment</CardTitle>
                <CardDescription>Select a payment method and process your payment</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex gap-3 mb-6">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Payment processed successfully!</p>
                      <p className="text-sm text-green-800 dark:text-green-200">Your payment has been recorded.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Order Selection */}
                  <div>
                    <Label htmlFor="order">Select Order</Label>
                    <select
                      id="order"
                      value={orderNumber}
                      onChange={(e) => {
                        setOrderNumber(e.target.value)
                        const order = mockOrders.find(o => o.number === e.target.value)
                        if (order) setAmount(order.amount.toString())
                      }}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mt-2"
                      required
                    >
                      <option value="">Choose an order...</option>
                      {mockOrders.filter(o => o.status === 'pending').map(order => (
                        <option key={order.number} value={order.number}>
                          {order.number} - ৳{order.amount.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <Label htmlFor="amount">Amount (৳)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      disabled
                      className="mt-2"
                    />
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {paymentMethods.map(method => {
                        const IconComponent = method.icon
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedMethod(method.id as PaymentMethod)}
                            className={`p-3 border rounded-lg text-left transition-all ${
                              selectedMethod === method.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <IconComponent className="h-4 w-4" />
                              <p className="font-medium text-sm text-foreground">{method.name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Method-specific Fields */}
                  {selectedMethod === 'card' && (
                    <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
                      <div>
                        <Label htmlFor="cardName">Card Holder Name</Label>
                        <Input id="cardName" placeholder="John Doe" className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input id="cardNumber" placeholder="4532 1488 0343 6467" className="mt-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" className="mt-2" />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" placeholder="123" type="password" className="mt-2" />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'bank' && (
                    <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
                      <div>
                        <Label htmlFor="accountName">Account Holder Name</Label>
                        <Input id="accountName" placeholder="Your Name" className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input id="accountNumber" placeholder="1234567890" className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="bank">Bank Name</Label>
                        <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mt-2">
                          <option>Commercial Bank of Ethiopia</option>
                          <option>Awash Bank</option>
                          <option>Dashen Bank</option>
                          <option>United Bank</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'mobile' && (
                    <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
                      <div>
                        <Label htmlFor="mobileNumber">Phone Number</Label>
                        <Input id="mobileNumber" placeholder="+251911234567" className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="provider">Mobile Money Provider</Label>
                        <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mt-2">
                          <option>Telebirr</option>
                          <option>M-Birr</option>
                          <option>Ebirr</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'cash' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        You will pay ৳{amount || '0'} in cash when the order is delivered.
                      </p>
                    </div>
                  )}

                  <Button type="submit" disabled={!amount || !orderNumber} className="w-full h-11">
                    Process Payment
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockOrders.map(order => (
                  <div key={order.number} className="p-3 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-foreground text-sm">{order.number}</p>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status === 'paid' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {order.status === 'paid' ? 'Paid' : 'Pending'}
                      </div>
                    </div>
                    <p className="text-sm text-foreground font-bold">৳{order.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{order.date}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
