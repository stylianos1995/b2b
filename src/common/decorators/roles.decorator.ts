import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";

/**
 * Allowed roles for a route (e.g. business_owner, business_manager, provider_owner).
 * Use with RolesGuard.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
