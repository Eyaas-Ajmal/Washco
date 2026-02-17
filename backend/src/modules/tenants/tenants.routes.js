import { Router } from 'express';
import Joi from 'joi';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as tenantsController from './tenants.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireManager, requireSuperAdmin } from '../../middleware/rbac.js';
import { requireTenantAccess } from '../../middleware/tenant.js';
import { validateBody, validateQuery } from '../../middleware/validator.js';
import { useCloudinary } from '../../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Multer config — use memory storage (for Cloudinary) or disk (for local dev)
let storage;
if (useCloudinary) {
    storage = multer.memoryStorage();
} else {
    const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads', 'carwashes');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${req.user.id}-${Date.now()}${ext}`);
        },
    });
}

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype.split('/')[1]);
        if (ext && mime) return cb(null, true);
        cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
    },
});



const router = Router();

// Validation schemas
const createTenantSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(1000).optional(),
    address: Joi.string().max(500).required(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s-]{10,20}$/).optional(),
    email: Joi.string().email().required(),
});

const updateTenantSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(1000).optional(),
    address: Joi.string().max(500).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s-]{10,20}$/).optional(),
    email: Joi.string().email().optional(),
});

const listQuerySchema = Joi.object({
    search: Joi.string().max(100).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

// Manager routes - MUST come before /:slug to avoid matching 'manager' as slug
router.get(
    '/manager/own',
    authenticate,
    requireManager,
    tenantsController.getOwn
);

router.patch(
    '/manager/own',
    authenticate,
    requireManager,
    requireTenantAccess,
    validateBody(updateTenantSchema),
    tenantsController.update
);

// Image upload route
router.post(
    '/manager/own/image',
    authenticate,
    requireManager,
    upload.single('image'),
    tenantsController.uploadImage
);

// Public routes
router.get('/', validateQuery(listQuerySchema), tenantsController.listPublic);
router.get('/:slug', tenantsController.getBySlug);

// Manager create route
router.post(
    '/',
    authenticate,
    requireManager,
    validateBody(createTenantSchema),
    tenantsController.create
);

export default router;

