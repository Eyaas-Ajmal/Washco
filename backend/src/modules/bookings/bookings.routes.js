import { Router } from 'express';
import Joi from 'joi';
import * as bookingsController from './bookings.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireCustomer, requireManager } from '../../middleware/rbac.js';
import { requireTenantAccess } from '../../middleware/tenant.js';
import { validateBody, validateQuery } from '../../middleware/validator.js';
import { bookingLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Validation schemas
const createBookingSchema = Joi.object({
    tenantId: Joi.string().uuid().required(),
    serviceId: Joi.string().uuid().required(),
    slotId: Joi.string().uuid().required(),
    notes: Joi.string().max(500).optional(),
});

const updateStatusSchema = Joi.object({
    status: Joi.string().valid('confirmed', 'in_progress', 'completed', 'no_show').required(),
});

const cancelSchema = Joi.object({
    reason: Joi.string().max(500).optional(),
});

const listQuerySchema = Joi.object({
    status: Joi.string().valid('reserved', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

// Customer routes
router.post(
    '/',
    authenticate,
    requireCustomer,
    bookingLimiter,
    validateBody(createBookingSchema),
    bookingsController.create
);

router.get(
    '/my',
    authenticate,
    requireCustomer,
    validateQuery(listQuerySchema),
    bookingsController.getMyBookings
);

router.patch(
    '/:id/cancel',
    authenticate,
    requireCustomer,
    validateBody(cancelSchema),
    bookingsController.cancelMyBooking
);

// Manager routes
router.get(
    '/tenant',
    authenticate,
    requireManager,
    requireTenantAccess,
    validateQuery(listQuerySchema),
    bookingsController.getTenantBookings
);

router.patch(
    '/:id/status',
    authenticate,
    requireManager,
    requireTenantAccess,
    validateBody(updateStatusSchema),
    bookingsController.updateStatus
);

router.patch(
    '/:id/manager-cancel',
    authenticate,
    requireManager,
    requireTenantAccess,
    validateBody(cancelSchema),
    bookingsController.cancelBooking
);

router.get(
    '/dashboard',
    authenticate,
    requireManager,
    requireTenantAccess,
    bookingsController.getDashboardStats
);

export default router;
