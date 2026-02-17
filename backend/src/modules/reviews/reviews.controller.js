import * as reviewsService from './reviews.service.js';

/**
 * Create review
 */
export const create = async (req, res, next) => {
    try {
        const review = await reviewsService.create({
            customerId: req.user.id,
            bookingId: req.body.bookingId,
            rating: req.body.rating,
            comment: req.body.comment,
        });

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully.',
            data: review,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get reviews for a tenant
 */
export const getByTenant = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await reviewsService.getByTenant(req.tenantId, {
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 20,
        });

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export default {
    create,
    getByTenant,
};
