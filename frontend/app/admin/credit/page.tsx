'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { creditService, CreditAccount, Invoice } from '@/lib/services/credit-service'
import { api } from '@/lib/api'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { CreditCard, Plus, Pause, Play, AlertCircle, FileText, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Retailer { id: number; username: string; full_name?: string; email: string; verification_status: string }

export default function AdminCreditPage() {
  const { token } = useAuth()
  const [tab, setTab] = useState<'accounts' | 'invoices' | 'grant'>('accounts')
  const [accounts, setAccounts] = useState<CreditAccount[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  // Grant form
  const [grantForm, setGrantForm] = useState({ retailer_id: '', credit_limit: '', payment_due_days: '30', notes: '' })

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [accs, invs] = await Promise.all([
        creditService.getAllCreditAccounts(token),
        creditService.getAllInvoices(token),
      ])
      setAccounts(accs)
      setInvoices(invs)
      // Load verified retailers without credit
      const users = await api.get<any[]>('/api/v1/admin/users?role=retailer&limit=100', token)
      setRetailers(users.filter((u: any) => u.verification_status === 'verified'))
    } catch (err: any) {
      toast.error(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleSuspend = async (acc: CreditAccount) => {
    const reason = prompt('Suspension reason:')
    if (!reason || !token) return
    setActionId(acc.id)
    try {
      await creditService.suspendCredit(acc.id, reason, token)
      toast.success('Credit suspended')
      load()
    } catch (err: any) { toast.error(err.message) }
    finally { setActionId(null) }
  }

  const handleReinstate = async (acc: CreditAccount) => {
    if (!token) return
    setActionId(acc.id)
    try {
      await creditService.reinstateCredit(acc.id, token)
      toast.success('Credit reinstated')
      load()
    } catch (err: any) { toast.error(err.message) }
    finally { setActionId(null) }
  }

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    try {
      await creditService.grantCredit({
        retailer_id: Number(grantForm.retailer_id),
        credit_limit: Number(grantForm.credit_limit),
        payment_due_days: Number(grantForm.payment_due_days),
        notes: grantForm.notes || undefined,
      }, token)
      toast.success('Credit account created')
      setGrantForm({ retailer_id: '', credit_limit: '', payment_due_days: '30', notes: '' })
      setTab('accounts')
      load()
    } catch (err: any) { toast.error(err.message) }
  }

  const INVOICE_COLORS: Record<string, string> = {
    issued: 'bg-blue-100 text-blue-800', paid: 'bg-green-100 text-green-800',
    partially_paid: 'bg-yellow-100 text-yellow-800', overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">Credit Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        {[
          { id: 'accounts', label: 'Credit Accounts', icon: Users },
          { id: 'invoices', label: 'All Invoices', icon: FileText },
          { id: 'grant', label: 'Grant Credit', icon: Plus },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSkeleton type="table" count={4} /> : (
        <>
          {/* Credit Accounts */}
          {tab === 'accounts' && (
            accounts.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No credit accounts yet. Use "Grant Credit" to create one.</p>
            ) : (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-secondary/30">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Retailer</th>
                      <th className="px-4 py-3 text-left font-semibold">Limit</th>
                      <th className="px-4 py-3 text-left font-semibold">Used</th>
                      <th className="px-4 py-3 text-left font-semibold">Available</th>
                      <th className="px-4 py-3 text-left font-semibold">Utilization</th>
                      <th className="px-4 py-3 text-left font-semibold">Due Days</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {accounts.map(acc => (
                      <tr key={acc.id} className="hover:bg-secondary/20">
                        <td className="px-4 py-3 font-medium">{acc.retailer_name || `Retailer #${acc.retailer_id}`}</td>
                        <td className="px-4 py-3">{acc.credit_limit.toLocaleString()} ETB</td>
                        <td className="px-4 py-3 text-orange-600">{acc.used_credit.toLocaleString()} ETB</td>
                        <td className="px-4 py-3 text-green-600">{acc.available_credit.toLocaleString()} ETB</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className={`h-full rounded-full ${acc.utilization_pct > 80 ? 'bg-red-500' : acc.utilization_pct > 50 ? 'bg-orange-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(acc.utilization_pct, 100)}%` }} />
                            </div>
                            <span className="text-xs">{acc.utilization_pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{acc.payment_due_days}d</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${acc.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {acc.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {acc.is_active ? (
                            <button onClick={() => handleSuspend(acc)} disabled={actionId === acc.id}
                              className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 ml-auto">
                              <Pause className="h-3 w-3" />Suspend
                            </button>
                          ) : (
                            <button onClick={() => handleReinstate(acc)} disabled={actionId === acc.id}
                              className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 ml-auto">
                              <Play className="h-3 w-3" />Reinstate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Invoices */}
          {tab === 'invoices' && (
            invoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No invoices yet.</p>
            ) : (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-secondary/30">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Invoice</th>
                      <th className="px-4 py-3 text-left font-semibold">Order</th>
                      <th className="px-4 py-3 text-left font-semibold">Retailer</th>
                      <th className="px-4 py-3 text-left font-semibold">Total</th>
                      <th className="px-4 py-3 text-left font-semibold">Balance</th>
                      <th className="px-4 py-3 text-left font-semibold">Due</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.map(inv => (
                      <tr key={inv.id} className={`hover:bg-secondary/20 ${inv.is_overdue ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                        <td className="px-4 py-3">#{inv.order_id}</td>
                        <td className="px-4 py-3">#{inv.retailer_id}</td>
                        <td className="px-4 py-3">{inv.total_amount.toLocaleString()} ETB</td>
                        <td className="px-4 py-3 font-semibold text-orange-600">{inv.balance_due.toLocaleString()} ETB</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                          {inv.is_overdue && <span className="ml-1 text-xs text-red-600 font-bold">!</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${INVOICE_COLORS[inv.status] || 'bg-gray-100 text-gray-700'}`}>
                            {inv.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Grant Credit */}
          {tab === 'grant' && (
            <div className="max-w-lg">
              <form onSubmit={handleGrant} className="bg-card rounded-lg border border-border p-6 space-y-4">
                <h2 className="text-lg font-semibold">Grant Credit to Retailer</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Retailer</label>
                  <select value={grantForm.retailer_id} onChange={e => setGrantForm(p => ({ ...p, retailer_id: e.target.value }))}
                    required className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground">
                    <option value="">Select verified retailer...</option>
                    {retailers.map(r => (
                      <option key={r.id} value={r.id}>{r.full_name || r.username} ({r.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Credit Limit (ETB)</label>
                  <Input type="number" min="1" value={grantForm.credit_limit} onChange={e => setGrantForm(p => ({ ...p, credit_limit: e.target.value }))} required placeholder="50000" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Due Days</label>
                  <Input type="number" min="1" max="365" value={grantForm.payment_due_days} onChange={e => setGrantForm(p => ({ ...p, payment_due_days: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                  <Input value={grantForm.notes} onChange={e => setGrantForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes about this credit account" />
                </div>
                <Button type="submit" className="w-full">Grant Credit Account</Button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  )
}
