import { query } from '../../config/database.js';

/**
 * Create review
 */
export const create = async ({ tenantId, customerId, bookingId, rating, comment }) => {
    const result = await query(
        `INSERT INTO reviews (tenant_id, customer_id, booking_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [tenantId, customerId, bookingId, rating, comment]
    );
    return result.rows[0];
};

/**
 * Find reviews by tenant
 */
export const findByTenantId = async (tenantId, { limit = 20, offset = 0 }) => {
    const result = await query(
        `SELECT r.*, u.full_name as customer_name
     FROM reviews r
     JOIN users u ON u.id = r.customer_id
     WHERE r.tenant_id = $1 AND r.is_visible = TRUE
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
        [tenantId, limit, offset]
    );

    const countResult = await query(
        'SELECT COUNT(*) FROM reviews WHERE tenant_id = $1 AND is_visible = TRUE',
        [tenantId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    return { reviews: result.rows, total };
};

/**
 * Check if booking already has a review
 */
export const findByBookingId = async (bookingId) => {
    const result = await query(
        'SELECT * FROM reviews WHERE booking_id = $1',
        [bookingId]
    );
    return result.rows[0] || null;
};

/**
 * Toggle review visibility (manager)
 */
export const toggleVisibility = async (id, isVisible) => {
    const result = await query(
        'UPDATE reviews SET is_visible = $1 WHERE id = $2 RETURNING *',
        [isVisible, id]
    );
    return result.rows[0];
};

/**
 * Get average rating for tenant
 */
export const getAverageRating = async (tenantId) => {
    const result = await query(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
     FROM reviews 
     WHERE tenant_id = $1 AND is_visible = TRUE`,
        [tenantId]
    );
    return result.rows[0];
};

export default {
    create,
    findByTenantId,
    findByBookingId,
    toggleVisibility,
    getAverageRating,
};
