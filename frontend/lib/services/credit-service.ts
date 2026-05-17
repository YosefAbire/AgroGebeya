import { api } from '../api'

export interface CreditAccount {
  id: number
  retailer_id: number
  retailer_name?: string
  credit_limit: number
  used_credit: number
  available_credit: number
  utilization_pct: number
  payment_due_days: number
  is_active: boolean
  approved_at?: string
  suspended_at?: string
  suspension_reason?: string
  notes?: string
  created_at: string
}

export interface Invoice {
  id: number
  invoice_number: string
  order_id: number
  retailer_id: number
  farmer_id: number
  subtotal: number
  tax_amount: number
  total_amount: number
  paid_amount: number
  balance_due: number
  payment_type: string
  status: string
  due_date?: string
  paid_at?: string
  penalty_amount: number
  is_overdue: boolean
  created_at: string
}

export const creditService = {
  // Retailer
  getMyCredit: (token: string) =>
    api.get<CreditAccount>('/api/v1/credit/my-credit', token),

  getMyInvoices: (token: string, status?: string) =>
    api.get<Invoice[]>(`/api/v1/credit/my-invoices${status ? `?status_filter=${status}` : ''}`, token),

  payInvoice: (invoiceId: number, amount: number, token: string) =>
    api.post(`/api/v1/credit/invoices/${invoiceId}/pay`, { amount, payment_method: 'chapa' }, token),

  placeCreditOrder: (data: { product_id: number; quantity: number; delivery_date?: string }, token: string) =>
    api.post('/api/v1/credit/order', data, token),

  // Admin
  getAllCreditAccounts: (token: string) =>
    api.get<CreditAccount[]>('/api/v1/credit/admin/accounts', token),

  getAllInvoices: (token: string, status?: string) =>
    api.get<Invoice[]>(`/api/v1/credit/admin/invoices${status ? `?status_filter=${status}` : ''}`, token),

  grantCredit: (data: { retailer_id: number; credit_limit: number; payment_due_days: number; notes?: string }, token: string) =>
    api.post<CreditAccount>('/api/v1/credit/admin/grant', data, token),

  updateCredit: (creditId: number, data: Partial<{ credit_limit: number; payment_due_days: number; notes: string }>, token: string) =>
    api.put<CreditAccount>(`/api/v1/credit/admin/${creditId}`, data, token),

  suspendCredit: (creditId: number, reason: string, token: string) =>
    api.post<CreditAccount>(`/api/v1/credit/admin/${creditId}/suspend`, { reason }, token),

  reinstateCredit: (creditId: number, token: string) =>
    api.post<CreditAccount>(`/api/v1/credit/admin/${creditId}/reinstate`, {}, token),
}
