import * as servicesService from './services.service.js';
import { createAuditLog } from '../../utils/audit.js';
import { getClientIp } from '../../utils/helpers.js';

/**
 * List services for a tenant (public)
 */
export const listByTenant = async (req, res, next) => {
    try {
        const services = await servicesService.listByTenant(req.tenantId);
        res.json({ success: true, data: services });
    } catch (error) {
        next(error);
    }
};

/**
 * List services for manager
 */
export const listForManager = async (req, res, next) => {
    try {
        const services = await servicesService.listByTenantManager(req.tenantId);
        res.json({ success: true, data: services });
    } catch (error) {
        next(error);
    }
};

/**
 * Create service
 */
export const create = async (req, res, next) => {
    try {
        const service = await servicesService.create(req.tenantId, req.body);

        await createAuditLog({
            userId: req.user.id,
            tenantId: req.tenantId,
            action: 'CREATE_SERVICE',
            entityType: 'service',
            entityId: service.id,
            newValues: req.body,
            ipAddress: getClientIp(req),
        });

        res.status(201).json({ success: true, data: service });
    } catch (error) {
        next(error);
    }
};

/**
 * Update service
 */
export const update = async (req, res, next) => {
    try {
        const service = await servicesService.update(
            req.params.id,
            req.tenantId,
            req.body
        );

        await createAuditLog({
            userId: req.user.id,
            tenantId: req.tenantId,
            action: 'UPDATE_SERVICE',
            entityType: 'service',
            entityId: req.params.id,
            newValues: req.body,
            ipAddress: getClientIp(req),
        });

        res.json({ success: true, data: service });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete service
 */
export const remove = async (req, res, next) => {
    try {
        await servicesService.remove(req.params.id, req.tenantId);

        await createAuditLog({
            userId: req.user.id,
            tenantId: req.tenantId,
            action: 'DELETE_SERVICE',
            entityType: 'service',
            entityId: req.params.id,
            ipAddress: getClientIp(req),
        });

        res.json({ success: true, message: 'Service deleted.' });
    } catch (error) {
        next(error);
    }
};

export default {
    listByTenant,
    listForManager,
    create,
    update,
    remove,
};
