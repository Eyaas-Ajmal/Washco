import { Router } from 'express';
import Joi from 'joi';
import * as slotsController from './slots.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireManager } from '../../middleware/rbac.js';
import { requireTenantAccess, extractTenantFromParams } from '../../middleware/tenant.js';
import { validateBody, validateQuery } from '../../middleware/validator.js';

const router = Router();

// Validation schemas
const dateRangeSchema = Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
});

const generateSlotsSchema = Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    slotDuration: Joi.number().integer().min(15).max(240).default(60),
    capacity: Joi.number().integer().min(1).max(100).default(1),
});

const updateSlotSchema = Joi.object({
    maxCapacity: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string().valid('available', 'blocked').optional(),
});

const operatingHoursSchema = Joi.object({
    hours: Joi.array().items(
        Joi.object({
            dayOfWeek: Joi.number().integer().min(0).max(6).required(),
            openTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
            closeTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
            isClosed: Joi.boolean().default(false),
        })
    ).min(1).max(7).required(),
});

// Manager routes
router.get(
    '/',
    authenticate,
    requireManager,
    requireTenantAccess,
    validateQuery(dateRangeSchema),
    slotsController.getForManager
);

router.post(
    '/generate',
    authenticate,
    requireManager,
    requireTenantAccess,
    validateBody(generateSlotsSchema),
    slotsController.generate
);

router.patch(
    '/:id',
    authenticate,
    requireManager,
    requireTenantAccess,
    validateBody(updateSlotSchema),
    slotsController.update
);

router.post(
    '/:id/block',
    authenticate,
    requireManager,
    requireTenantAccess,
    slotsController.block
);

router.post(
    '/:id/unblock',
    authenticate,
    requireManager,
    requireTenantAccess,
    slotsController.unblock
);

router.get(
    '/operating-hours',
    authenticate,
    requireManager,
    requireTenantAccess,
    slotsController.getOperatingHours
);

router.put(
    '/operating-hours',
    authenticate,
    requireManager,
    requireTenantAccess,
    validateBody(operatingHoursSchema),
    slotsController.setOperatingHours
);

export default router;
