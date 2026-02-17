/**
 * Role-based access control middleware
 * 
 * Roles hierarchy:
 * - super_admin: Full platform access
 * - manager: Tenant-scoped access
 * - customer: Customer-level access
 */

export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    MANAGER: 'manager',
    CUSTOMER: 'customer',
};

/**
 * Check if user has required role(s)
 * @param {...string} allowedRoles - Roles that are allowed access
 * @returns {Function} Express middleware
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions.',
            });
        }

        next();
    };
};

/**
 * Require super admin role
 */
export const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);

/**
 * Require manager role (or super admin)
 */
export const requireManager = requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER);

/**
 * Require customer role (or any authenticated user)
 */
export const requireCustomer = requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.CUSTOMER);

/**
 * Check if user is owner of the resource or super admin
 * @param {Function} getOwnerId - Function to extract owner ID from request
 * @returns {Function} Express middleware
 */
export const requireOwnerOrAdmin = (getOwnerId) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.',
            });
        }

        // Super admin can access anything
        if (req.user.role === ROLES.SUPER_ADMIN) {
            return next();
        }

        try {
            const ownerId = await getOwnerId(req);

            if (req.user.id !== ownerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied. You do not own this resource.',
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

export default {
    ROLES,
    requireRole,
    requireSuperAdmin,
    requireManager,
    requireCustomer,
    requireOwnerOrAdmin,
};
