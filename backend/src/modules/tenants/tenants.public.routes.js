import { Router } from 'express';
import Joi from 'joi';
import * as tenantsService from '../tenants/tenants.service.js';
import * as servicesService from '../services/services.service.js';
import * as slotsService from '../slots/slots.service.js';
import { extractTenantFromParams } from '../../middleware/tenant.js';
import { validateQuery } from '../../middleware/validator.js';

const router = Router();

// Validation schemas
const slotsQuerySchema = Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
});

// Get tenant services
router.get(
    '/:slug/services',
    extractTenantFromParams('slug'),
    async (req, res, next) => {
        try {
            const services = await servicesService.listByTenant(req.tenantId);
            res.json({ success: true, data: services });
        } catch (error) {
            next(error);
        }
    }
);

// Get tenant available slots
router.get(
    '/:slug/slots',
    extractTenantFromParams('slug'),
    validateQuery(slotsQuerySchema),
    async (req, res, next) => {
        try {
            const { startDate, endDate } = req.query;
            const slots = await slotsService.getAvailableSlots(req.tenantId, startDate, endDate);
            res.json({ success: true, data: slots });
        } catch (error) {
            next(error);
        }
    }
);

// Get tenant operating hours
router.get(
    '/:slug/hours',
    extractTenantFromParams('slug'),
    async (req, res, next) => {
        try {
            const hours = await slotsService.getOperatingHours(req.tenantId);
            res.json({ success: true, data: hours });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
