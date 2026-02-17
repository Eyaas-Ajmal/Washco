import { Router } from 'express';
import Joi from 'joi';
import argon2 from 'argon2';
import { query } from '../../config/database.js';
import { authenticate } from '../../middleware/auth.js';
import { requireSuperAdmin } from '../../middleware/rbac.js';
import { validateQuery, validateBody } from '../../middleware/validator.js';
import * as tenantsController from '../tenants/tenants.controller.js';

const router = Router();

// Validation schemas
const listTenantsSchema = Joi.object({
    status: Joi.string().valid('pending', 'approved', 'suspended').optional(),
    search: Joi.string().max(100).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

const auditLogsSchema = Joi.object({
    userId: Joi.string().uuid().optional(),
    tenantId: Joi.string().uuid().optional(),
    action: Joi.string().max(50).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
});

const createManagerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    fullName: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^\+?[\d\s-]{8,20}$/).optional().allow('', null),
});

// Middleware to require super admin
router.use(authenticate, requireSuperAdmin);

// Dashboard stats
router.get('/dashboard', async (req, res, next) => {
    try {
        const [tenants, users, bookings] = await Promise.all([
            query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
          COUNT(*) as total
        FROM tenants
      `),
            query(`
        SELECT 
          COUNT(*) FILTER (WHERE role = 'customer') as customers,
          COUNT(*) FILTER (WHERE role = 'manager') as managers,
          COUNT(*) as total
        FROM users
      `),
            query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0) as total_revenue
        FROM bookings
      `),
        ]);

        res.json({
            success: true,
            data: {
                tenants: {
                    pending: parseInt(tenants.rows[0].pending, 10),
                    approved: parseInt(tenants.rows[0].approved, 10),
                    suspended: parseInt(tenants.rows[0].suspended, 10),
                    total: parseInt(tenants.rows[0].total, 10),
                },
                users: {
                    customers: parseInt(users.rows[0].customers, 10),
                    managers: parseInt(users.rows[0].managers, 10),
                    total: parseInt(users.rows[0].total, 10),
                },
                bookings: {
                    total: parseInt(bookings.rows[0].total, 10),
                    totalRevenue: parseFloat(bookings.rows[0].total_revenue),
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// Tenants management
router.get('/tenants', validateQuery(listTenantsSchema), tenantsController.listAll);
router.patch('/tenants/:id/approve', tenantsController.approve);
router.patch('/tenants/:id/suspend', tenantsController.suspend);

// Create manager account
router.post('/users/create-manager', validateBody(createManagerSchema), async (req, res, next) => {
    try {
        const { email, password, fullName, phone } = req.body;

        // Check if email already exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, error: 'Email is already registered.' });
        }

        // Hash password
        const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

        // Create manager user
        const result = await query(
            `INSERT INTO users (email, password_hash, full_name, phone, role, is_verified)
             VALUES ($1, $2, $3, $4, 'manager', true) RETURNING id, email, full_name, role`,
            [email, passwordHash, fullName, phone || null]
        );

        // Audit log
        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
             VALUES ($1, 'CREATE_MANAGER', 'user', $2, $3, $4)`,
            [req.user.id, result.rows[0].id, JSON.stringify({ email, fullName }), req.ip]
        );

        res.status(201).json({
            success: true,
            message: `Manager account created for ${email}`,
            data: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
});

// Users list
router.get('/users', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, role } = req.query;
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        let sql = `
      SELECT u.id, u.email, u.full_name, u.phone, u.role, u.is_verified, u.created_at,
             t.name as tenant_name
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
    `;
        const params = [];
        let paramCount = 1;

        if (role) {
            sql += ` WHERE u.role = $${paramCount++}`;
            params.push(role);
        }

        sql += ` ORDER BY u.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        params.push(parseInt(limit, 10), offset);

        const result = await query(sql, params);

        const countSql = role
            ? 'SELECT COUNT(*) FROM users WHERE role = $1'
            : 'SELECT COUNT(*) FROM users';
        const countResult = await query(countSql, role ? [role] : []);
        const total = parseInt(countResult.rows[0].count, 10);

        res.json({
            success: true,
            data: {
                users: result.rows,
                pagination: {
                    total,
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10),
                    totalPages: Math.ceil(total / parseInt(limit, 10)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// Delete a user
router.delete('/users/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (id === req.user.id) {
            return res.status(400).json({ success: false, error: 'You cannot delete your own account.' });
        }

        // Check user exists
        const userResult = await query('SELECT id, email, role FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        const targetUser = userResult.rows[0];

        // Prevent deleting other super admins
        if (targetUser.role === 'super_admin') {
            return res.status(403).json({ success: false, error: 'Cannot delete a super admin account.' });
        }

        // Delete user (CASCADE will clean up related records)
        await query('DELETE FROM users WHERE id = $1', [id]);

        // Audit log
        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
             VALUES ($1, 'DELETE_USER', 'user', $2, $3, $4)`,
            [req.user.id, id, JSON.stringify({ email: targetUser.email, role: targetUser.role }), req.ip]
        );

        res.json({ success: true, message: `User ${targetUser.email} has been removed.` });
    } catch (error) {
        next(error);
    }
});

// Audit logs
router.get('/audit-logs', validateQuery(auditLogsSchema), async (req, res, next) => {
    try {
        const { userId, tenantId, action, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        let sql = `
      SELECT al.*, u.email as user_email, t.name as tenant_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN tenants t ON t.id = al.tenant_id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 1;

        if (userId) {
            sql += ` AND al.user_id = $${paramCount++}`;
            params.push(userId);
        }
        if (tenantId) {
            sql += ` AND al.tenant_id = $${paramCount++}`;
            params.push(tenantId);
        }
        if (action) {
            sql += ` AND al.action = $${paramCount++}`;
            params.push(action);
        }

        sql += ` ORDER BY al.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        params.push(parseInt(limit, 10), offset);

        const result = await query(sql, params);

        res.json({
            success: true,
            data: {
                logs: result.rows,
                pagination: {
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10),
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
