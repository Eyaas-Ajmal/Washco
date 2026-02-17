import Joi from 'joi';

/**
 * Validate request body against a Joi schema
 * @param {Joi.Schema} schema - Joi schema
 * @returns {Function} Express middleware
 */
export const validateBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/"/g, ''),
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors,
            });
        }

        req.body = value;
        next();
    };
};

/**
 * Validate query parameters against a Joi schema
 * @param {Joi.Schema} schema - Joi schema
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/"/g, ''),
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors,
            });
        }

        req.query = value;
        next();
    };
};

/**
 * Validate route parameters against a Joi schema
 * @param {Joi.Schema} schema - Joi schema
 * @returns {Function} Express middleware
 */
export const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/"/g, ''),
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors,
            });
        }

        req.params = value;
        next();
    };
};

// Common validation schemas
export const schemas = {
    uuid: Joi.string().uuid({ version: 'uuidv4' }),

    email: Joi.string().email().lowercase().trim(),

    password: Joi.string().min(8).max(128),

    phone: Joi.string().pattern(/^\+?[\d\s-]{10,20}$/),

    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
    }),

    dateRange: Joi.object({
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')),
    }),
};

export default {
    validateBody,
    validateQuery,
    validateParams,
    schemas,
};
