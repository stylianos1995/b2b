export interface BaseEventPayload {
  event_id: string;
  event_type: string;
  schema_version: string;
  producer_service: string;
  occurred_at: string;
  correlation_id?: string;
  causation_id?: string;
}

export interface UserRegisteredPayload extends BaseEventPayload {
  user_id: string;
  email: string;
  registered_at: string;
}

export interface BusinessCreatedPayload extends BaseEventPayload {
  business_id: string;
  owner_user_id: string;
  created_at: string;
}

export interface ProviderVerifiedPayload extends BaseEventPayload {
  provider_id: string;
  verified_at: string;
}

export interface ProductCreatedPayload extends BaseEventPayload {
  product_id: string;
  provider_id: string;
  created_at: string;
}

export interface OrderPlacedPayload extends BaseEventPayload {
  order_id: string;
  business_id: string;
  provider_id: string;
  submitted_at: string;
}

export interface OrderConfirmedPayload extends BaseEventPayload {
  order_id: string;
  business_id: string;
  provider_id: string;
  confirmed_at: string;
}

export interface OrderPreparedPayload extends BaseEventPayload {
  order_id: string;
  provider_id: string;
  at: string;
}

export interface OrderDispatchedPayload extends BaseEventPayload {
  order_id: string;
  business_id: string;
  provider_id: string;
  at: string;
}

export interface OrderDeliveredPayload extends BaseEventPayload {
  order_id: string;
  delivery_id: string;
  business_id: string;
  provider_id: string;
  delivered_at: string;
}

export interface InvoiceGeneratedPayload extends BaseEventPayload {
  invoice_id: string;
  provider_id: string;
  business_id: string;
  order_ids: string[];
  issued_at: string;
}

export interface PaymentInitiatedPayload extends BaseEventPayload {
  payment_id: string;
  payable_type: string;
  payable_id: string;
  amount: string;
  currency: string;
  initiated_at: string;
}

export interface PaymentCompletedPayload extends BaseEventPayload {
  payment_id: string;
  payable_type: string;
  payable_id: string;
  amount: string;
  paid_at: string;
}

export interface PayoutExecutedPayload extends BaseEventPayload {
  payout_id: string;
  provider_id: string;
  amount: string;
  currency: string;
  executed_at: string;
}

export interface RatingSubmittedPayload extends BaseEventPayload {
  rating_id: string;
  order_id: string;
  business_id: string;
  provider_id: string;
  rating: number;
  submitted_at: string;
}
