import { query } from '../config/database.js';
import { ROLES } from './rbac.js';

/**
 * Tenant isolation middleware
 * Ensures managers can only access their own tenant's data
 */
export const requireTenantAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.',
            });
        }

        // Super admin has access to all tenants
        if (req.user.role === ROLES.SUPER_ADMIN) {
            // Allow super admin to optionally scope to a tenant via query param
            if (req.query.tenantId) {
                req.tenantId = req.query.tenantId;
            }
            return next();
        }

        // Manager must have a tenant assigned
        if (req.user.role === ROLES.MANAGER) {
            if (!req.user.tenantId) {
                return res.status(403).json({
                    success: false,
                    error: 'No tenant associated with your account.',
                });
            }

            // Verify tenant exists and is active
            const result = await query(
                `SELECT id, status FROM tenants WHERE id = $1`,
                [req.user.tenantId]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'Tenant not found.',
                });
            }

            if (result.rows[0].status === 'suspended') {
                return res.status(403).json({
                    success: false,
                    error: 'Your car wash has been suspended. Please contact support.',
                });
            }

            req.tenantId = req.user.tenantId;
            return next();
        }

        // Customers don't have tenant scope by default
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Extract tenant ID from route parameter and verify access
 */
export const extractTenantFromParams = (paramName = 'tenantId') => {
    return async (req, res, next) => {
        try {
            const tenantId = req.params[paramName];

            if (!tenantId) {
                return res.status(400).json({
                    success: false,
                    error: 'Tenant ID is required.',
                });
            }

            // Verify tenant exists
            const result = await query(
                `SELECT id, status, slug FROM tenants WHERE id::text = $1 OR slug = $1`,
                [tenantId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Car wash not found.',
                });
            }

            const tenant = result.rows[0];

            // Check if tenant is accessible
            if (tenant.status !== 'approved' && req.user?.role !== ROLES.SUPER_ADMIN) {
                return res.status(404).json({
                    success: false,
                    error: 'Car wash not found.',
                });
            }

            req.tenantId = tenant.id;
            req.tenant = tenant;
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Inject tenant filter into database queries
 * Use this for building tenant-scoped queries
 */
export const buildTenantFilter = (req) => {
    if (req.tenantId) {
        return {
            clause: 'tenant_id = $',
            value: req.tenantId,
        };
    }
    return null;
};

export default {
    requireTenantAccess,
    extractTenantFromParams,
    buildTenantFilter,
};
