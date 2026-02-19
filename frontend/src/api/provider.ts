import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type { ProviderPublic, Product } from '../types';

export interface CreateProviderBody {
  legal_name: string;
  trading_name: string;
  provider_type: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
}

export interface CreateProductBody {
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  currency: string;
  tax_rate?: number;
  /** When set, product is only sold in these sizes (e.g. ["500ml", "1L", "2L", "5L", "10L"]). */
  allowed_sizes?: string[];
  /** Up to 3 image URLs. Recommended: JPEG/PNG/WebP, max 800×800px, under 500KB each. */
  image_urls?: string[];
}

export async function createProvider(body: CreateProviderBody): Promise<ProviderPublic> {
  return apiPost<ProviderPublic>('/providers', body);
}

export async function getProvider(id: string): Promise<ProviderPublic> {
  const res = await apiGet<Record<string, unknown>>(`/providers/${id}`);
  return { ...res, id: (res.provider_id ?? res.id) as string } as ProviderPublic;
}

export async function updateProvider(id: string, body: Partial<CreateProviderBody>): Promise<ProviderPublic> {
  return apiPatch<ProviderPublic>(`/providers/${id}`, body);
}

export async function getProviderProducts(providerId: string): Promise<Product[]> {
  const res = await apiGet<{ items?: Array<Record<string, unknown>> }>(`/providers/${providerId}/products`);
  const items = (res as { items?: Array<Record<string, unknown>> }).items ?? [];
  return items.map((p) => ({ ...p, id: (p.product_id ?? p.id) as string })) as Product[];
}

export async function addProduct(providerId: string, body: CreateProductBody): Promise<Product> {
  return apiPost<Product>(`/providers/${providerId}/products`, body);
}

export async function updateProduct(providerId: string, productId: string, body: Partial<CreateProductBody>): Promise<Product> {
  return apiPatch<Product>(`/providers/${providerId}/products/${productId}`, body);
}

export async function deleteProduct(providerId: string, productId: string): Promise<void> {
  return apiDelete<void>(`/providers/${providerId}/products/${productId}`);
}
