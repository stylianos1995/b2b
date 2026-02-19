import { apiGet, apiPost, apiPatch } from './client';
import type { Business, Location } from '../types';

export interface CreateBusinessBody {
  legal_name: string;
  trading_name: string;
  business_type: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
}

export interface CreateLocationBody {
  address_line_1: string;
  address_line_2?: string;
  city: string;
  region?: string;
  postal_code: string;
  country: string;
  location_type: string;
}

export async function createBusiness(body: CreateBusinessBody): Promise<Business> {
  return apiPost<Business>('/businesses', body);
}

export async function getBusiness(id: string): Promise<Business> {
  const res = await apiGet<Record<string, unknown>>(`/businesses/${id}`);
  return { ...res, id: (res.business_id ?? res.id) as string } as Business;
}

export async function updateBusiness(id: string, body: Partial<CreateBusinessBody>): Promise<Business> {
  return apiPatch<Business>(`/businesses/${id}`, body);
}

export async function addLocation(businessId: string, body: CreateLocationBody): Promise<Location> {
  return apiPost<Location>(`/businesses/${businessId}/locations`, body);
}

export async function getLocations(businessId: string): Promise<Location[]> {
  const res = await apiGet<{ items?: Array<Record<string, unknown>> }>(`/businesses/${businessId}/locations`);
  const items = (res as { items?: Array<Record<string, unknown>> }).items ?? [];
  return items.map((l) => ({ ...l, id: (l.location_id ?? l.id) as string })) as Location[];
}
