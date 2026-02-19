import { apiGet } from './client';
import type { ProviderPublic, Product, Paginated } from '../types';

export async function getProviders(params?: {
  provider_type?: string;
  postcode?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<Paginated<ProviderPublic> | { data: ProviderPublic[] }> {
  const q = new URLSearchParams();
  if (params?.provider_type) q.set('provider_type', params.provider_type);
  if (params?.postcode) q.set('postcode', params.postcode);
  if (params?.category) q.set('category', params.category);
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const query = q.toString();
  return apiGet(`/discovery/providers${query ? `?${query}` : ''}`);
}

export async function getProvider(id: string): Promise<ProviderPublic> {
  return apiGet<ProviderPublic>(`/discovery/providers/${id}`);
}

export async function getProviderProducts(providerId: string, params?: { limit?: number; offset?: number }): Promise<Paginated<Product> | { data: Product[] }> {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const query = q.toString();
  return apiGet(`/discovery/providers/${providerId}/products${query ? `?${query}` : ''}`);
}
