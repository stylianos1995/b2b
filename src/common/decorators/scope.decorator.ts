import { SetMetadata } from "@nestjs/common";

export const BUSINESS_SCOPE_KEY = "business_scope";
export const PROVIDER_SCOPE_KEY = "provider_scope";

/**
 * Resolve business_id from principal membership; 403 if no business.
 */
export const BusinessScope = () => SetMetadata(BUSINESS_SCOPE_KEY, true);

/**
 * Resolve provider_id from principal membership; 403 if no provider.
 */
export const ProviderScope = () => SetMetadata(PROVIDER_SCOPE_KEY, true);
