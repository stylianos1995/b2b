import { apiGet, apiPost, apiPatch } from './client';
import type { Order } from '../types';

export interface CreateOrderBody {
  provider_id: string;
  delivery_location_id: string;
  requested_delivery_date: string;
  lines: Array<{ product_id: string; quantity: number; unit?: string }>;
  notes?: string;
}

export async function listBuyerOrders(params?: { status?: string; limit?: number; offset?: number }): Promise<{ data: Order[]; items?: Order[] }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const query = q.toString();
  return apiGet(`/buyer/orders${query ? `?${query}` : ''}`);
}

export async function getBuyerOrder(id: string): Promise<Order> {
  return apiGet<Order>(`/buyer/orders/${id}`);
}

export async function placeOrder(body: CreateOrderBody): Promise<Order> {
  return apiPost<Order>('/buyer/orders', body);
}

export async function cancelOrder(id: string, reason?: string): Promise<void> {
  await apiPost(`/buyer/orders/${id}/cancel`, { reason });
}

export async function listProviderOrders(params?: {
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data?: Order[]; items?: Order[] }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.date_from) q.set('date_from', params.date_from);
  if (params?.date_to) q.set('date_to', params.date_to);
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const query = q.toString();
  return apiGet(`/provider/orders${query ? `?${query}` : ''}`);
}

export async function getProviderOrder(id: string): Promise<Order> {
  const res = await apiGet<Record<string, unknown>>(`/provider/orders/${id}`);
  const r = res as Record<string, unknown>;
  const lines = (Array.isArray(r.lines) ? r.lines : []) as Array<Record<string, unknown>>;
  return {
    id: (r.order_id ?? r.id) as string,
    order_number: r.order_number as string,
    provider_id: r.provider_id as string,
    business_id: r.business_id as string,
    delivery_location_id: "",
    status: r.status as string,
    subtotal: Number(r.subtotal),
    tax_total: Number(r.tax_total),
    total: Number(r.total),
    currency: (r.currency as string) ?? "GBP",
    requested_delivery_date:
      typeof r.requested_delivery_date === "string"
        ? r.requested_delivery_date
        : (r.requested_delivery_date as Date)?.toString?.()?.slice(0, 10) ?? "",
    lines: lines.map((l, i) => ({
      id: (l.id as string) ?? `line-${i}`,
      product_id: l.product_id as string,
      name: l.name as string,
      quantity: Number(l.quantity),
      unit: l.unit as string,
      unit_price: Number(l.unit_price),
      line_total: Number(l.line_total),
    })),
    delivery_id: r.delivery_id as string | undefined,
  } as Order;
}

export async function confirmOrder(id: string): Promise<Order> {
  return apiPost<Order>(`/provider/orders/${id}/confirm`, {});
}

export async function rejectOrder(id: string, reason?: string): Promise<void> {
  await apiPost(`/provider/orders/${id}/reject`, { reason });
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  return apiPatch<Order>(`/provider/orders/${id}`, { status });
}
