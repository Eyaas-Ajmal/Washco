import { Router } from 'express';
import Joi from 'joi';
import * as reviewsController from './reviews.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireCustomer } from '../../middleware/rbac.js';
import { extractTenantFromParams } from '../../middleware/tenant.js';
import { validateBody, validateQuery } from '../../middleware/validator.js';

const router = Router();

// Validation schemas
const createReviewSchema = Joi.object({
    bookingId: Joi.string().uuid().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().max(1000).optional(),
});

const listQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
});

// Customer routes
router.post(
    '/',
    authenticate,
    requireCustomer,
    validateBody(createReviewSchema),
    reviewsController.create
);

// Public route - get reviews for a tenant
router.get(
    '/tenant/:tenantId',
    extractTenantFromParams('tenantId'),
    validateQuery(listQuerySchema),
    reviewsController.getByTenant
);

export default router;
