import { apiGet, apiPatch } from './client';
import type { Delivery } from '../types';

export async function getDelivery(id: string): Promise<Delivery> {
  return apiGet<Delivery>(`/deliveries/${id}`);
}

export async function updateDelivery(id: string, body: { status?: string }): Promise<Delivery> {
  return apiPatch<Delivery>(`/deliveries/${id}`, body);
}
