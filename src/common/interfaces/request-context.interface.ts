/**
 * Request-scoped principal: user and memberships (business/provider).
 * Attached to request after JWT validation; used by scope guards and services.
 */
export interface Membership {
  businessId?: string;
  providerId?: string;
  role: string;
}

export interface RequestContext {
  userId: string;
  email: string;
  memberships: Membership[];
}
