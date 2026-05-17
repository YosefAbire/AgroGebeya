'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { creditService, CreditAccount, Invoice } from '@/lib/services/credit-service'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { CreditCard, AlertCircle, CheckCircle2, Clock, TrendingUp, FileText } from 'lucide-react'
import { toast } from 'sonner'

const INVOICE_STATUS_COLORS: Record<string, string> = {
  issued: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  partially_paid: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
}

export default function CreditPage() {
  const { token, user } = useAuth()
  const [credit, setCredit] = useState<CreditAccount | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [noCredit, setNoCredit] = useState(false)
  const [payingId, setPayingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const [c, inv] = await Promise.all([
        creditService.getMyCredit(token).catch(() => null),
        creditService.getMyInvoices(token),
      ])
      if (!c) { setNoCredit(true) } else { setCredit(c) }
      setInvoices(inv)
    } catch {
      setNoCredit(true)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const handlePayInvoice = async (invoice: Invoice) => {
    if (!token) return
    const amount = invoice.balance_due
    if (!confirm(`Pay ${amount.toLocaleString()} ETB for invoice ${invoice.invoice_number}?`)) return
    setPayingId(invoice.id)
    try {
      await creditService.payInvoice(invoice.id, amount, token)
      toast.success('Payment recorded')
      load()
    } catch (err: any) {
      toast.error(err.message || 'Payment failed')
    } finally {
      setPayingId(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8"><LoadingSkeleton type="stats" count={3} /></main>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Credit Account</h1>
          <p className="text-muted-foreground mt-1">Manage your deferred payment credit and invoices</p>
        </div>

        {/* Credit summary */}
        {noCredit ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Credit Account</h3>
            <p className="text-muted-foreground text-sm">Contact the admin to apply for a credit account. You must be verified first.</p>
            <Link href="/profile/verification" className="mt-4 inline-block text-primary hover:underline text-sm">
              Check verification status →
            </Link>
          </div>
        ) : credit && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border border-border p-5">
                <p className="text-sm text-muted-foreground">Credit Limit</p>
                <p className="text-2xl font-bold text-foreground mt-1">{credit.credit_limit.toLocaleString()} ETB</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-5">
                <p className="text-sm text-muted-foreground">Used</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{credit.used_credit.toLocaleString()} ETB</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-5">
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{credit.available_credit.toLocaleString()} ETB</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-5">
                <p className="text-sm text-muted-foreground">Utilization</p>
                <p className="text-2xl font-bold text-primary mt-1">{credit.utilization_pct}%</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${credit.utilization_pct > 80 ? 'bg-red-500' : credit.utilization_pct > 50 ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(credit.utilization_pct, 100)}%` }} />
                </div>
              </div>
            </div>

            {!credit.is_active && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Credit Account Suspended</p>
                  {credit.suspension_reason && <p className="text-sm text-red-700 mt-1">{credit.suspension_reason}</p>}
                </div>
              </div>
            )}

            <div className="bg-card rounded-lg border border-border p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Payment due within <strong className="text-foreground mx-1">{credit.payment_due_days} days</strong> of order placement
            </div>
          </>
        )}

        {/* Invoices */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />Invoices
          </h2>
          {invoices.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              No invoices yet. Place a credit order to generate invoices.
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Invoice</th>
                    <th className="px-4 py-3 text-left font-semibold">Order</th>
                    <th className="px-4 py-3 text-left font-semibold">Total</th>
                    <th className="px-4 py-3 text-left font-semibold">Paid</th>
                    <th className="px-4 py-3 text-left font-semibold">Balance</th>
                    <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map(inv => (
                    <tr key={inv.id} className={`hover:bg-secondary/20 ${inv.is_overdue ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs font-medium">{inv.invoice_number}</td>
                      <td className="px-4 py-3">
                        <Link href={`/orders/${inv.order_id}`} className="text-primary hover:underline">#{inv.order_id}</Link>
                      </td>
                      <td className="px-4 py-3 font-medium">{inv.total_amount.toLocaleString()} ETB</td>
                      <td className="px-4 py-3 text-green-600">{inv.paid_amount.toLocaleString()} ETB</td>
                      <td className="px-4 py-3 font-semibold text-orange-600">{inv.balance_due.toLocaleString()} ETB</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                        {inv.is_overdue && <span className="ml-1 text-xs text-red-600 font-medium">OVERDUE</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${INVOICE_STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-700'}`}>
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button onClick={() => handlePayInvoice(inv)} disabled={payingId === inv.id}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                            {payingId === inv.id ? 'Processing...' : 'Pay Now'}
                          </button>
                        )}
                        {inv.status === 'paid' && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
