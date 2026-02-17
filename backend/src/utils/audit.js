import { query } from '../config/database.js';
import logger from './logger.js';

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User performing the action
 * @param {string} params.tenantId - Tenant context (nullable)
 * @param {string} params.action - Action performed (e.g., 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} params.entityType - Entity type (e.g., 'booking', 'service')
 * @param {string} params.entityId - Entity ID
 * @param {Object} params.oldValues - Previous values (for updates)
 * @param {Object} params.newValues - New values
 * @param {string} params.ipAddress - Client IP address
 */
export const createAuditLog = async ({
    userId,
    tenantId = null,
    action,
    entityType,
    entityId,
    oldValues = null,
    newValues = null,
    ipAddress = null,
}) => {
    try {
        await query(
            `INSERT INTO audit_logs (user_id, tenant_id, action, entity_type, entity_id, old_values, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                userId,
                tenantId,
                action,
                entityType,
                entityId,
                oldValues ? JSON.stringify(oldValues) : null,
                newValues ? JSON.stringify(newValues) : null,
                ipAddress,
            ]
        );
    } catch (error) {
        // Don't fail the main operation if audit logging fails
        logger.error('Failed to create audit log:', error);
    }
};

export default { createAuditLog };
