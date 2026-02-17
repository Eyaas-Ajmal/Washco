import * as servicesRepository from './services.repository.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../middleware/errorHandler.js';

/**
 * List services for a tenant (public)
 */
export const listByTenant = async (tenantId) => {
    const services = await servicesRepository.findByTenantId(tenantId, false);
    return services.map(formatService);
};

/**
 * List all services for manager (includes inactive)
 */
export const listByTenantManager = async (tenantId) => {
    const services = await servicesRepository.findByTenantId(tenantId, true);
    return services;
};

/**
 * Get service by ID
 */
export const getById = async (id) => {
    const service = await servicesRepository.findById(id);
    if (!service) {
        throw new NotFoundError('Service not found.');
    }
    return service;
};

/**
 * Create service
 */
export const create = async (tenantId, data) => {
    const service = await servicesRepository.create({
        tenantId,
        name: data.name,
        description: data.description,
        price: data.price,
        durationMinutes: data.durationMinutes,
        bufferMinutes: data.bufferMinutes,
        sortOrder: data.sortOrder,
    });
    return service;
};

/**
 * Update service
 */
export const update = async (id, tenantId, data) => {
    const service = await servicesRepository.findById(id);

    if (!service) {
        throw new NotFoundError('Service not found.');
    }

    if (service.tenant_id !== tenantId) {
        throw new ForbiddenError('Access denied.');
    }

    const updated = await servicesRepository.update(id, data);
    return updated;
};

/**
 * Delete service
 */
export const remove = async (id, tenantId) => {
    const service = await servicesRepository.findById(id);

    if (!service) {
        throw new NotFoundError('Service not found.');
    }

    if (service.tenant_id !== tenantId) {
        throw new ForbiddenError('Access denied.');
    }

    // Try hard delete first, fall back to soft delete
    const hardDeleted = await servicesRepository.hardDelete(id);
    if (!hardDeleted) {
        await servicesRepository.remove(id);
    }

    return true;
};

// Helpers
function formatService(service) {
    return {
        id: service.id,
        name: service.name,
        description: service.description,
        price: parseFloat(service.price),
        durationMinutes: service.duration_minutes,
        bufferMinutes: service.buffer_minutes,
    };
}

export default {
    listByTenant,
    listByTenantManager,
    getById,
    create,
    update,
    remove,
};
