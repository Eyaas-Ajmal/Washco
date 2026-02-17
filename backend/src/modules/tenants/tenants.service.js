import * as tenantsRepository from './tenants.repository.js';
import * as authRepository from '../auth/auth.repository.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../middleware/errorHandler.js';

/**
 * List tenants (public - only approved)
 */
export const listPublic = async ({ search, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const { tenants, total } = await tenantsRepository.findAll({
        status: 'approved',
        search,
        limit,
        offset,
    });

    return {
        tenants: tenants.map(formatTenantPublic),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * List all tenants (admin)
 */
export const listAll = async ({ status, search, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const { tenants, total } = await tenantsRepository.findAll({
        status,
        search,
        limit,
        offset,
    });

    return {
        tenants,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get tenant by slug (public)
 */
export const getBySlug = async (slug) => {
    const tenant = await tenantsRepository.findByIdOrSlug(slug);

    if (!tenant) {
        throw new NotFoundError('Car wash not found.');
    }

    if (tenant.status !== 'approved') {
        throw new NotFoundError('Car wash not found.');
    }

    return formatTenantPublic(tenant);
};

/**
 * Get tenant by ID (admin/manager)
 */
export const getById = async (id) => {
    const tenant = await tenantsRepository.findByIdOrSlug(id);

    if (!tenant) {
        throw new NotFoundError('Tenant not found.');
    }

    return tenant;
};

/**
 * Create tenant (manager registration)
 */
export const create = async ({ userId, name, description, address, latitude, longitude, phone, email }) => {
    // Check if user already owns a tenant
    const existing = await tenantsRepository.findByOwnerId(userId);
    if (existing) {
        throw new ConflictError('You already have a registered car wash.');
    }

    // Generate unique slug
    const slug = await tenantsRepository.generateUniqueSlug(name);

    // Create tenant
    const tenant = await tenantsRepository.create({
        name,
        slug,
        description,
        address,
        latitude,
        longitude,
        phone,
        email,
        ownerId: userId,
    });

    // Update user with tenant_id
    await authRepository.update(userId, { tenantId: tenant.id });

    return tenant;
};

/**
 * Update tenant
 */
export const update = async (id, userId, data) => {
    const tenant = await tenantsRepository.findByIdOrSlug(id);

    if (!tenant) {
        throw new NotFoundError('Tenant not found.');
    }

    if (tenant.owner_id !== userId) {
        throw new BadRequestError('You are not the owner of this car wash.');
    }

    const updated = await tenantsRepository.update(id, data);
    return updated;
};

/**
 * Approve tenant (admin)
 */
export const approve = async (id) => {
    const tenant = await tenantsRepository.findByIdOrSlug(id);

    if (!tenant) {
        throw new NotFoundError('Tenant not found.');
    }

    if (tenant.status === 'approved') {
        throw new BadRequestError('Tenant is already approved.');
    }

    return await tenantsRepository.updateStatus(id, 'approved');
};

/**
 * Suspend tenant (admin)
 */
export const suspend = async (id) => {
    const tenant = await tenantsRepository.findByIdOrSlug(id);

    if (!tenant) {
        throw new NotFoundError('Tenant not found.');
    }

    if (tenant.status === 'suspended') {
        throw new BadRequestError('Tenant is already suspended.');
    }

    return await tenantsRepository.updateStatus(id, 'suspended');
};

/**
 * Get manager's own tenant
 */
export const getOwnTenant = async (userId) => {
    const tenant = await tenantsRepository.findByOwnerId(userId);

    if (!tenant) {
        throw new NotFoundError('You do not have a registered car wash.');
    }

    return tenant;
};

// Helpers
function formatTenantPublic(tenant) {
    return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        description: tenant.description,
        address: tenant.address,
        latitude: tenant.latitude ? parseFloat(tenant.latitude) : null,
        longitude: tenant.longitude ? parseFloat(tenant.longitude) : null,
        phone: tenant.phone,
        email: tenant.email,
        imageUrl: tenant.image_url || null,
        avgRating: parseFloat(tenant.avg_rating) || 0,
        reviewCount: parseInt(tenant.review_count, 10) || 0,
    };
}

/**
 * Upload car wash image
 */
export const uploadImage = async (userId, imageUrl) => {
    const tenant = await tenantsRepository.findByOwnerId(userId);
    if (!tenant) {
        throw new NotFoundError('You do not have a registered car wash.');
    }

    const updated = await tenantsRepository.update(tenant.id, { image_url: imageUrl });
    return updated;
};

export default {
    listPublic,
    listAll,
    getBySlug,
    getById,
    create,
    update,
    approve,
    suspend,
    getOwnTenant,
    uploadImage,
};
