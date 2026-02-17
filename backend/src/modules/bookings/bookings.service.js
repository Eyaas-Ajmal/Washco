import * as bookingsRepository from './bookings.repository.js';
import * as servicesRepository from '../services/services.repository.js';
import * as slotsRepository from '../slots/slots.repository.js';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../../middleware/errorHandler.js';

// Valid status transitions
const STATUS_TRANSITIONS = {
    reserved: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled', 'no_show'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
    no_show: [],
};

/**
 * Create booking
 */
export const create = async ({ customerId, tenantId, serviceId, slotId, notes }) => {
    // Validate service exists and belongs to tenant
    const service = await servicesRepository.findById(serviceId);
    if (!service) {
        throw new NotFoundError('Service not found.');
    }
    if (service.tenant_id !== tenantId) {
        throw new BadRequestError('Service does not belong to this car wash.');
    }
    if (!service.is_active) {
        throw new BadRequestError('Service is not available.');
    }

    // Get slot info
    const slot = await slotsRepository.findById(slotId);
    if (!slot) {
        throw new NotFoundError('Time slot not found.');
    }
    if (slot.tenant_id !== tenantId) {
        throw new BadRequestError('Time slot does not belong to this car wash.');
    }

    try {
        const booking = await bookingsRepository.createWithLock({
            tenantId,
            customerId,
            serviceId,
            timeSlotId: slotId,
            bookingDate: slot.slot_date,
            startTime: slot.start_time,
            endTime: slot.end_time,
            totalAmount: service.price,
            notes,
        });

        return formatBooking(booking, service, slot);
    } catch (error) {
        if (error.message === 'SLOT_NOT_FOUND') {
            throw new NotFoundError('Time slot not found.');
        }
        if (error.message === 'SLOT_BLOCKED') {
            throw new BadRequestError('This time slot is not available.');
        }
        if (error.message === 'SLOT_FULL') {
            throw new ConflictError('This time slot is no longer available.');
        }
        throw error;
    }
};

/**
 * Get customer's bookings
 */
export const getMyBookings = async (customerId, { status, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const { bookings, total } = await bookingsRepository.findByCustomerId(customerId, {
        status,
        limit,
        offset,
    });

    return {
        bookings: bookings.map(formatCustomerBooking),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get tenant's bookings (manager)
 */
export const getTenantBookings = async (tenantId, { status, startDate, endDate, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const { bookings, total } = await bookingsRepository.findByTenantId(tenantId, {
        status,
        startDate,
        endDate,
        limit,
        offset,
    });

    return {
        bookings: bookings.map(formatManagerBooking),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get booking by ID
 */
export const getById = async (id) => {
    const booking = await bookingsRepository.findById(id);
    if (!booking) {
        throw new NotFoundError('Booking not found.');
    }
    return booking;
};

/**
 * Update booking status (manager)
 */
export const updateStatus = async (id, tenantId, newStatus) => {
    const booking = await bookingsRepository.findById(id);

    if (!booking) {
        throw new NotFoundError('Booking not found.');
    }

    if (booking.tenant_id !== tenantId) {
        throw new ForbiddenError('Access denied.');
    }

    const allowedTransitions = STATUS_TRANSITIONS[booking.status];
    if (!allowedTransitions.includes(newStatus)) {
        throw new BadRequestError(
            `Cannot transition from '${booking.status}' to '${newStatus}'.`
        );
    }

    // Auto-set payment status to paid when completed
    let paymentStatus = null;
    if (newStatus === 'completed' && booking.payment_status === 'pending') {
        paymentStatus = 'paid';
    }

    const updated = await bookingsRepository.updateStatus(id, newStatus, paymentStatus);
    return updated;
};

/**
 * Cancel booking (customer)
 */
export const cancelByCustomer = async (id, customerId, reason) => {
    const booking = await bookingsRepository.findById(id);

    if (!booking) {
        throw new NotFoundError('Booking not found.');
    }

    if (booking.customer_id !== customerId) {
        throw new ForbiddenError('Access denied.');
    }

    if (!['reserved', 'confirmed'].includes(booking.status)) {
        throw new BadRequestError('This booking cannot be cancelled.');
    }

    // Check cancellation policy (e.g., must be at least 2 hours before)
    const bookingTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    const now = new Date();
    const hoursUntilBooking = (bookingTime - now) / (1000 * 60 * 60);

    if (hoursUntilBooking < 2) {
        throw new BadRequestError('Bookings cannot be cancelled less than 2 hours before the scheduled time.');
    }

    return await bookingsRepository.cancel(id, reason || 'Cancelled by customer');
};

/**
 * Cancel booking (manager)
 */
export const cancelByManager = async (id, tenantId, reason) => {
    const booking = await bookingsRepository.findById(id);

    if (!booking) {
        throw new NotFoundError('Booking not found.');
    }

    if (booking.tenant_id !== tenantId) {
        throw new ForbiddenError('Access denied.');
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
        throw new BadRequestError('This booking cannot be cancelled.');
    }

    return await bookingsRepository.cancel(id, reason || 'Cancelled by car wash');
};

/**
 * Get dashboard stats
 */
export const getDashboardStats = async (tenantId) => {
    const stats = await bookingsRepository.getTenantStats(tenantId);
    const todaySchedule = await bookingsRepository.getTodaySchedule(tenantId);

    return {
        todayBookings: parseInt(stats.today_count, 10) || 0,
        upcomingBookings: parseInt(stats.upcoming_count, 10) || 0,
        todayRevenue: parseFloat(stats.today_revenue) || 0,
        monthlyRevenue: parseFloat(stats.monthly_revenue) || 0,
        pendingBookings: parseInt(stats.pending_count, 10) || 0,
        inProgressBookings: parseInt(stats.in_progress_count, 10) || 0,
        completedBookings: parseInt(stats.completed_count, 10) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        todaySchedule: todaySchedule.map(b => ({
            id: b.id,
            slotTime: b.start_time?.substring(0, 5),
            customerName: b.customer_name,
            serviceName: b.service_name,
            status: b.status,
        })),
    };
};

// Formatters
function formatBooking(booking, service, slot) {
    return {
        id: booking.id,
        status: booking.status,
        paymentStatus: booking.payment_status,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        totalAmount: parseFloat(booking.total_amount),
        service: {
            id: service.id,
            name: service.name,
        },
        createdAt: booking.created_at,
    };
}

function formatCustomerBooking(booking) {
    return {
        id: booking.id,
        status: booking.status,
        paymentStatus: booking.payment_status,
        bookingDate: booking.booking_date,
        startTime: booking.start_time?.substring(0, 5),
        endTime: booking.end_time?.substring(0, 5),
        totalAmount: parseFloat(booking.total_amount),
        service: {
            name: booking.service_name,
            price: parseFloat(booking.service_price),
        },
        tenant: {
            name: booking.tenant_name,
            slug: booking.tenant_slug,
            address: booking.tenant_address,
        },
        createdAt: booking.created_at,
    };
}

function formatManagerBooking(booking) {
    return {
        id: booking.id,
        status: booking.status,
        paymentStatus: booking.payment_status,
        bookingDate: booking.booking_date,
        startTime: booking.start_time?.substring(0, 5),
        endTime: booking.end_time?.substring(0, 5),
        totalAmount: parseFloat(booking.total_amount),
        service: {
            name: booking.service_name,
            price: parseFloat(booking.service_price),
        },
        customer: {
            name: booking.customer_name,
            email: booking.customer_email,
            phone: booking.customer_phone,
        },
        notes: booking.notes,
        createdAt: booking.created_at,
    };
}

export default {
    create,
    getMyBookings,
    getTenantBookings,
    getById,
    updateStatus,
    cancelByCustomer,
    cancelByManager,
    getDashboardStats,
};
