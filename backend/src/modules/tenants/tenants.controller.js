import * as tenantsService from './tenants.service.js';
import { createAuditLog } from '../../utils/audit.js';
import { getClientIp } from '../../utils/helpers.js';
import { cloudinary, useCloudinary } from '../../config/cloudinary.js';

/**
 * List public tenants (car washes)
 */
export const listPublic = async (req, res, next) => {
    try {
        const { search, page, limit } = req.query;
        const result = await tenantsService.listPublic({
            search,
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 20,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get tenant by slug (public)
 */
export const getBySlug = async (req, res, next) => {
    try {
        const tenant = await tenantsService.getBySlug(req.params.slug);

        res.json({
            success: true,
            data: tenant,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create tenant (manager registration)
 */
export const create = async (req, res, next) => {
    try {
        const tenant = await tenantsService.create({
            userId: req.user.id,
            ...req.body,
        });

        await createAuditLog({
            userId: req.user.id,
            tenantId: tenant.id,
            action: 'CREATE_TENANT',
            entityType: 'tenant',
            entityId: tenant.id,
            newValues: req.body,
            ipAddress: getClientIp(req),
        });

        res.status(201).json({
            success: true,
            message: 'Car wash registration submitted. Pending approval.',
            data: tenant,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update own tenant
 */
export const update = async (req, res, next) => {
    try {
        const tenant = await tenantsService.update(
            req.tenantId,
            req.user.id,
            req.body
        );

        await createAuditLog({
            userId: req.user.id,
            tenantId: req.tenantId,
            action: 'UPDATE_TENANT',
            entityType: 'tenant',
            entityId: req.tenantId,
            newValues: req.body,
            ipAddress: getClientIp(req),
        });

        res.json({
            success: true,
            data: tenant,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get own tenant (manager)
 */
export const getOwn = async (req, res, next) => {
    try {
        const tenant = await tenantsService.getOwnTenant(req.user.id);

        res.json({
            success: true,
            data: tenant,
        });
    } catch (error) {
        next(error);
    }
};

// Admin controllers
export const listAll = async (req, res, next) => {
    try {
        const { status, search, page, limit } = req.query;
        const result = await tenantsService.listAll({
            status,
            search,
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 20,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const approve = async (req, res, next) => {
    try {
        const tenant = await tenantsService.approve(req.params.id);

        await createAuditLog({
            userId: req.user.id,
            tenantId: tenant.id,
            action: 'APPROVE_TENANT',
            entityType: 'tenant',
            entityId: tenant.id,
            ipAddress: getClientIp(req),
        });

        res.json({
            success: true,
            message: 'Tenant approved successfully.',
            data: tenant,
        });
    } catch (error) {
        next(error);
    }
};

export const suspend = async (req, res, next) => {
    try {
        const tenant = await tenantsService.suspend(req.params.id);

        await createAuditLog({
            userId: req.user.id,
            tenantId: tenant.id,
            action: 'SUSPEND_TENANT',
            entityType: 'tenant',
            entityId: tenant.id,
            ipAddress: getClientIp(req),
        });

        res.json({
            success: true,
            message: 'Tenant suspended.',
            data: tenant,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload car wash image
 */
export const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file provided.' });
        }

        let imageUrl;

        if (useCloudinary) {
            // Upload to Cloudinary via buffer
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'washco/carwashes', public_id: `${req.user.id}-${Date.now()}`, resource_type: 'image' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });
            imageUrl = result.secure_url;
        } else {
            imageUrl = `/uploads/carwashes/${req.file.filename}`;
        }

        const tenant = await tenantsService.uploadImage(req.user.id, imageUrl);

        await createAuditLog({
            userId: req.user.id,
            tenantId: tenant.id,
            action: 'UPLOAD_IMAGE',
            entityType: 'tenant',
            entityId: tenant.id,
            newValues: { imageUrl },
            ipAddress: getClientIp(req),
        });

        res.json({
            success: true,
            message: 'Image uploaded successfully.',
            data: { imageUrl },
        });
    } catch (error) {
        next(error);
    }
};

export default {
    listPublic,
    getBySlug,
    create,
    update,
    getOwn,
    listAll,
    approve,
    suspend,
    uploadImage,
};
