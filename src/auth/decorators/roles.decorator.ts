import { SetMetadata } from '@nestjs/common';

/**
 * Key for roles metadata
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * @param roles - Array of role names required for access
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
