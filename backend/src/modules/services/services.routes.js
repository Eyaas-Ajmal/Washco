import { Router } from 'express';
import Joi from 'joi';
import * as servicesController from './services.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireManager } from '../../middleware/rbac.js';
import { requireTenantAccess, extractTenantFromParams } from '../../middleware/tenant.js';
import { validateBody } from '../../middleware/validator.js';

const router = Router();

// Validation schemas
const createServiceSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().positive().required(),
    durationMinutes: Joi.number().integer().min(5).max(480).required(),
    bufferMinutes: Joi.number().integer().min(0).max(60).default(0),
    sortOrder: Joi.number().integer().min(0).default(0),
});

const updateServiceSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().positive().optional(),
    durationMinutes: Joi.number().integer().min(5).max(480).optional(),
    bufferMinutes: Joi.number().integer().min(0).max(60).optional(),
    isActive: Joi.boolean().optional(),
    sortOrder: Joi.number().integer().min(0).optional(),
});

// Manager routes
router.get(
    '/',
    authenticate,
    requireManager,
    requireTenantAccess,
    servicesController.listForManager
);

router.post(
    '/',
    authenticate,
    requireManager,
    requireTenantAccess,
    validateBody(createServiceSchema),
    servicesController.create
);

router.put(
    '/:id',
    authenticate,
    requireManager,
    requireTenantAccess,
    validateBody(updateServiceSchema),
    servicesController.update
);

router.delete(
    '/:id',
    authenticate,
    requireManager,
    requireTenantAccess,
    servicesController.remove
);

export default router;
