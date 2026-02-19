const API_BASE = '/v1';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

/** Download invoice PDF; triggers browser download. */
export async function downloadInvoicePdf(invoiceId: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/invoices/${invoiceId}/pdf`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = (data as { message?: string })?.message ?? res.statusText;
    throw new Error(typeof msg === 'string' ? msg : 'Failed to download PDF');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="?([^";\n]+)"?/);
  const filename = match ? match[1].trim() : `invoice-${invoiceId}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

import { apiGet, apiPost } from './client';
import type { Invoice } from '../types';

export interface BuyerInvoicesResponse {
  items: Array<{
    invoice_id: string;
    invoice_number: string;
    provider_id: string;
    status: string;
    total: string | number;
    currency: string;
    due_date: string;
    paid_at?: string;
    created_at: string;
  }>;
  next_cursor?: string;
}

export async function listBuyerInvoices(): Promise<BuyerInvoicesResponse> {
  return apiGet<BuyerInvoicesResponse>('/buyer/invoices');
}

/** Create Stripe Checkout session for an invoice; returns URL to redirect the buyer to. */
export async function createCheckoutSession(invoiceId: string): Promise<{ url: string }> {
  return apiPost<{ url: string }>('/payments/checkout-session', { invoiceId });
}

export async function listProviderInvoices(): Promise<Invoice[]> {
  const res = await apiGet<{ items?: Array<Record<string, unknown>> }>('/provider/invoices');
  const items = (res as { items?: Array<Record<string, unknown>> }).items ?? [];
  return items.map((i) => ({
    id: (i.invoice_id ?? i.id) as string,
    invoice_number: i.invoice_number,
    provider_id: i.provider_id,
    business_id: i.business_id,
    status: i.status,
    total: Number(i.total),
    currency: i.currency,
    due_date: i.due_date,
  })) as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice> {
  return apiGet<Invoice>(`/invoices/${id}`);
}

export async function createInvoiceFromOrder(orderId: string): Promise<Invoice> {
  return apiPost<Invoice>('/invoices', { order_id: orderId });
}

export async function payInvoice(invoiceId: string): Promise<{ status?: string }> {
  return apiPost(`/invoices/${invoiceId}/payments`, {});
}
