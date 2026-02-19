export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  memberships: Array<{ business_id?: string; provider_id?: string; role: string }>;
}

export interface Business {
  id: string;
  legal_name: string;
  trading_name: string;
  business_type: string;
  status: string;
  default_currency: string;
  default_delivery_address_id?: string;
}

export interface Location {
  id: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  region?: string;
  postal_code: string;
  country: string;
  location_type: string;
  is_default: boolean;
}

export interface ProviderPublic {
  id: string;
  legal_name: string;
  trading_name: string;
  provider_type: string;
  status: string;
  default_currency: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  currency: string;
  tax_rate: number;
  is_active: boolean;
  /** When set, product is only sold in these sizes (e.g. ["500ml", "1L", "2L", "5L", "10L"]). */
  allowed_sizes?: string[];
  /** Up to 3 image URLs. */
  image_urls?: string[];
}

export interface OrderLine {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  provider_id: string;
  business_id: string;
  delivery_location_id: string;
  status: string;
  subtotal: number;
  tax_total: number;
  total: number;
  currency: string;
  requested_delivery_date: string;
  submitted_at?: string;
  confirmed_at?: string;
  delivered_at?: string;
  lines?: OrderLine[];
  delivery_id?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  provider_id: string;
  business_id: string;
  status: string;
  total: number;
  currency: string;
  due_date: string;
  order_id?: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  status: string;
  actual_delivery_at?: string;
}

export interface Paginated<T> {
  data: T[];
  total?: number;
  limit?: number;
  offset?: number;
}

export interface CartLine {
  product_id: string;
  name: string;
  sku: string;
  unit: string;
  unit_price?: number;
  currency?: string;
  quantity: number;
}
