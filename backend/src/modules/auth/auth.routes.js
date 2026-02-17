import { Router } from 'express';
import Joi from 'joi';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validator.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    fullName: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^\+?[\d\s-]{8,20}$/).optional().messages({
        'string.pattern.base': 'Phone number must be 8-20 digits',
    }),
    role: Joi.string().valid('customer').optional(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
    fullName: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s-]{10,20}$/).allow(null, '').optional(),
});

// Routes
router.post(
    '/register',
    authLimiter,
    validateBody(registerSchema),
    authController.register
);

router.post(
    '/login',
    authLimiter,
    validateBody(loginSchema),
    authController.login
);

router.post('/refresh', authController.refresh);

router.post('/logout', authController.logout);

router.post('/logout-all', authenticate, authController.logoutAll);

router.get('/profile', authenticate, authController.getProfile);

router.patch(
    '/profile',
    authenticate,
    validateBody(updateProfileSchema),
    authController.updateProfile
);

export default router;
