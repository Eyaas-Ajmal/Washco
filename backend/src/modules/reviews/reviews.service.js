import * as reviewsRepository from './reviews.repository.js';
import * as bookingsRepository from '../bookings/bookings.repository.js';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../../middleware/errorHandler.js';

/**
 * Create review (only for completed bookings)
 */
export const create = async ({ customerId, bookingId, rating, comment }) => {
    // Check booking exists and belongs to customer
    const booking = await bookingsRepository.findById(bookingId);

    if (!booking) {
        throw new NotFoundError('Booking not found.');
    }

    if (booking.customer_id !== customerId) {
        throw new ForbiddenError('You can only review your own bookings.');
    }

    if (booking.status !== 'completed') {
        throw new BadRequestError('You can only review completed bookings.');
    }

    // Check if already reviewed
    const existingReview = await reviewsRepository.findByBookingId(bookingId);
    if (existingReview) {
        throw new ConflictError('You have already reviewed this booking.');
    }

    const review = await reviewsRepository.create({
        tenantId: booking.tenant_id,
        customerId,
        bookingId,
        rating,
        comment,
    });

    return review;
};

/**
 * Get reviews for a tenant
 */
export const getByTenant = async (tenantId, { page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const { reviews, total } = await reviewsRepository.findByTenantId(tenantId, {
        limit,
        offset,
    });

    const avgData = await reviewsRepository.getAverageRating(tenantId);

    return {
        reviews: reviews.map(formatReview),
        averageRating: parseFloat(avgData.avg_rating) || 0,
        totalReviews: parseInt(avgData.total_reviews, 10) || 0,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// Helper
function formatReview(review) {
    return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        customerName: review.customer_name,
        createdAt: review.created_at,
    };
}

export default {
    create,
    getByTenant,
};
