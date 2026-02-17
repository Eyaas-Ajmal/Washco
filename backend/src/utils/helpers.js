import crypto from 'crypto';

/**
 * Generate a random token
 * @param {number} length - Token length in bytes
 * @returns {string} - Hex encoded token
 */
export const generateToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a token using SHA256
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Parse duration string to milliseconds
 * @param {string} duration - Duration string (e.g., '15m', '7d')
 * @returns {number} - Duration in milliseconds
 */
export const parseDuration = (duration) => {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
        throw new Error(`Invalid duration format: ${duration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
};

/**
 * Get client IP address from request
 * @param {import('express').Request} req - Express request
 * @returns {string} - Client IP address
 */
export const getClientIp = (req) => {
    return (
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket?.remoteAddress ||
        'unknown'
    );
};

/**
 * Paginate results
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination object with offset and limit
 */
export const paginate = (page = 1, limit = 20) => {
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    return {
        offset: (validPage - 1) * validLimit,
        limit: validLimit,
        page: validPage,
    };
};

/**
 * Create pagination metadata
 * @param {number} totalItems - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination metadata
 */
export const paginationMeta = (totalItems, page, limit) => {
    const totalPages = Math.ceil(totalItems / limit);

    return {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};

export default {
    generateToken,
    hashToken,
    parseDuration,
    getClientIp,
    paginate,
    paginationMeta,
};
