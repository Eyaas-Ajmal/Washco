import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

/**
 * Default rate limiter
 */
export const defaultLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter for auth endpoints
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 10 attempts per window
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed requests
});

/**
 * Rate limiter for booking operations
 */
export const bookingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 booking attempts per minute
    message: {
        success: false,
        error: 'Too many booking attempts, please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for password reset
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 reset attempts per hour
    message: {
        success: false,
        error: 'Too many password reset attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export default {
    defaultLimiter,
    authLimiter,
    bookingLimiter,
    passwordResetLimiter,
};
