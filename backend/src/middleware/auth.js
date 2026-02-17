import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { query } from '../config/database.js';

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Authentication failed: No token provided');
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.',
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            // console.log('Token verified for user:', decoded.userId);

            // Fetch fresh user data
            const result = await query(
                `SELECT id, email, full_name, role, tenant_id, is_verified 
         FROM users 
         WHERE id = $1`,
                [decoded.userId]
            );

            if (result.rows.length === 0) {
                console.log('Authentication failed: User not found in DB', decoded.userId);
                return res.status(401).json({
                    success: false,
                    error: 'User not found.',
                });
            }

            const user = result.rows[0];

            if (!user.is_verified && config.env === 'production') {
                return res.status(403).json({
                    success: false,
                    error: 'Please verify your email address.',
                });
            }

            req.user = {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                tenantId: user.tenant_id,
            };

            next();
        } catch (jwtError) {
            console.error('JWT Verification Error:', jwtError.name, jwtError.message);
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expired.',
                    code: 'TOKEN_EXPIRED',
                });
            }

            return res.status(401).json({
                success: false,
                error: 'Invalid token.',
            });
        }
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        next(error);
    }
};

/**
 * Optional authentication - attaches user if token is valid
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwt.secret);

            const result = await query(
                `SELECT id, email, full_name, role, tenant_id 
         FROM users 
         WHERE id = $1`,
                [decoded.userId]
            );

            if (result.rows.length > 0) {
                const user = result.rows[0];
                req.user = {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    tenantId: user.tenant_id,
                };
            }
        } catch {
            // Token invalid, continue without user
        }

        next();
    } catch (error) {
        next(error);
    }
};

export default { authenticate, optionalAuth };
