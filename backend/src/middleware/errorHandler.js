import logger from '../utils/logger.js';
import config from '../config/env.js';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Not Found error
 */
export class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(404, message);
    }
}

/**
 * Bad Request error
 */
export class BadRequestError extends ApiError {
    constructor(message = 'Bad request', details = null) {
        super(400, message, details);
    }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(403, message);
    }
}

/**
 * Conflict error (e.g., duplicate booking)
 */
export class ConflictError extends ApiError {
    constructor(message = 'Conflict') {
        super(409, message);
    }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
    // Log error
    if (err.isOperational) {
        logger.warn(`Operational error: ${err.message}`, {
            statusCode: err.statusCode,
            path: req.path,
            method: req.method,
        });
    } else {
        logger.error('Unexpected error:', err);
    }

    // Handle known operational errors
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
            ...(err.details && { details: err.details }),
        });
    }

    // Handle Joi validation errors
    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: err.details.map((d) => ({
                field: d.path.join('.'),
                message: d.message,
            })),
        });
    }

    // Handle PostgreSQL errors
    if (err.code) {
        switch (err.code) {
            case '23505': // unique_violation
                return res.status(409).json({
                    success: false,
                    error: 'A record with this value already exists.',
                });
            case '23503': // foreign_key_violation
                return res.status(400).json({
                    success: false,
                    error: 'Referenced record does not exist.',
                });
            case '23502': // not_null_violation
                return res.status(400).json({
                    success: false,
                    error: 'Required field is missing.',
                });
            default:
                // Log unknown database errors
                logger.error('Database error:', { code: err.code, message: err.message });
        }
    }

    // Default to 500 Internal Server Error
    const statusCode = err.statusCode || 500;
    const message = config.env === 'production'
        ? 'An unexpected error occurred'
        : err.message;

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(config.env === 'development' && { stack: err.stack }),
    });
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
    });
};

export default {
    ApiError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    errorHandler,
    notFoundHandler,
};
