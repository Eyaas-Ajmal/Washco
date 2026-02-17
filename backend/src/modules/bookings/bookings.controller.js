import * as bookingsService from './bookings.service.js';
import { createAuditLog } from '../../utils/audit.js';
import { getClientIp } from '../../utils/helpers.js';

/**
 * Create booking (customer)
 */
export const create = async (req, res, next) => {
    try {
        const booking = await bookingsService.create({
            customerId: req.user.id,
            tenantId: req.body.tenantId,
            serviceId: req.body.serviceId,
            slotId: req.body.slotId,
            notes: req.body.notes,
        });

        await createAuditLog({
            userId: req.user.id,
            tenantId: req.body.tenantId,
            action: 'CREATE_BOOKING',
            entityType: 'booking',
            entityId: booking.id,
            newValues: { serviceId: req.body.serviceId, slotId: req.body.slotId },
            ipAddress: getClientIp(req),
        });

        res.status(201).json({
            success: true,
            message: 'Booking created successfully.',
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my bookings (customer)
 */
export const getMyBookings = async (req, res, next) => {
    try {
        const { status, page, limit } = req.query;
        const result = await bookingsService.getMyBookings(req.user.id, {
            status,
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 20,
        });

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel my booking (customer)
 */
export const cancelMyBooking = async (req, res, next) => {
    try {
        const booking = await bookingsService.cancelByCustomer(
            req.params.id,
            req.user.id,
            req.body.reason
        );

        await createAuditLog({
            userId: req.user.id,
            tenantId: booking.tenant_id,
            action: 'CANCEL_BOOKING',
            entityType: 'booking',
            entityId: booking.id,
            newValues: { reason: req.body.reason, cancelledBy: 'customer' },
            ipAddress: getClientIp(req),
        });

        res.json({
            success: true,
            message: 'Booking cancelled successfully.',
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get tenant bookings (manager)
 */
export const getTenantBookings = async (req, res, next) => {
    try {
        const { status, startDate, endDate, page, limit } = req.query;
        const result = await bookingsService.getTenantBookings(req.tenantId, {
            status,
            startDate,
            endDate,
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 20,
        });

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Update booking status (manager)
 */
export const updateStatus = async (req, res, next) => {
    try {
        const booking = await bookingsService.updateStatus(
            req.params.id,
            req.tenantId,
            req.body.status
        );

        await createAuditLog({
            userId: req.user.id,
            tenantId: req.tenantId,
            action: 'UPDATE_BOOKING_STATUS',
            entityType: 'booking',
            entityId: booking.id,
            newValues: { status: req.body.status },
            ipAddress: getClientIp(req),
        });

        res.json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel booking (manager)
 */
export const cancelBooking = async (req, res, next) => {
    try {
        const booking = await bookingsService.cancelByManager(
            req.params.id,
            req.tenantId,
            req.body.reason
        );

        await createAuditLog({
            userId: req.user.id,
            tenantId: req.tenantId,
            action: 'CANCEL_BOOKING',
            entityType: 'booking',
            entityId: booking.id,
            newValues: { reason: req.body.reason, cancelledBy: 'manager' },
            ipAddress: getClientIp(req),
        });

        res.json({ success: true, message: 'Booking cancelled.', data: booking });
    } catch (error) {
        next(error);
    }
};

/**
 * Get dashboard stats (manager)
 */
export const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await bookingsService.getDashboardStats(req.tenantId);
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

export default {
    create,
    getMyBookings,
    cancelMyBooking,
    getTenantBookings,
    updateStatus,
    cancelBooking,
    getDashboardStats,
};
