import { query, getClient, transaction } from '../../config/database.js';
import * as slotsRepository from '../slots/slots.repository.js';

/**
 * Create booking with atomic locking
 */
export const createWithLock = async ({ tenantId, customerId, serviceId, timeSlotId, bookingDate, startTime, endTime, totalAmount, notes }) => {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // Lock the slot to prevent race conditions
        const slot = await slotsRepository.findByIdWithLock(client, timeSlotId);

        if (!slot) {
            throw new Error('SLOT_NOT_FOUND');
        }

        if (slot.tenant_id !== tenantId) {
            throw new Error('SLOT_TENANT_MISMATCH');
        }

        if (slot.status === 'blocked') {
            throw new Error('SLOT_BLOCKED');
        }

        if (slot.booked_count >= slot.max_capacity) {
            throw new Error('SLOT_FULL');
        }

        // Create the booking
        const result = await client.query(
            `INSERT INTO bookings (tenant_id, customer_id, service_id, time_slot_id, booking_date, start_time, end_time, total_amount, notes, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'reserved', 'pending')
       RETURNING *`,
            [tenantId, customerId, serviceId, timeSlotId, bookingDate, startTime, endTime, totalAmount, notes]
        );

        // Increment booking count on slot
        await slotsRepository.incrementBookedCount(client, timeSlotId);

        await client.query('COMMIT');

        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Find bookings by tenant
 */
export const findByTenantId = async (tenantId, { status, startDate, endDate, limit = 50, offset = 0 }) => {
    let sql = `
    SELECT b.*, 
           s.name as service_name, s.price as service_price,
           u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone,
           ts.start_time as slot_start, ts.end_time as slot_end
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN users u ON u.id = b.customer_id
    JOIN time_slots ts ON ts.id = b.time_slot_id
    WHERE b.tenant_id = $1
  `;
    const params = [tenantId];
    let paramCount = 2;

    if (status) {
        sql += ` AND b.status = $${paramCount++}`;
        params.push(status);
    }

    if (startDate) {
        sql += ` AND b.booking_date >= $${paramCount++}`;
        params.push(startDate);
    }

    if (endDate) {
        sql += ` AND b.booking_date <= $${paramCount++}`;
        params.push(endDate);
    }

    sql += ` ORDER BY b.booking_date DESC, b.start_time DESC`;
    sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) FROM bookings WHERE tenant_id = $1';
    const countParams = [tenantId];
    if (status) {
        countSql += ' AND status = $2';
        countParams.push(status);
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    return { bookings: result.rows, total };
};

/**
 * Find bookings by customer
 */
export const findByCustomerId = async (customerId, { status, limit = 50, offset = 0 }) => {
    let sql = `
    SELECT b.*, 
           s.name as service_name, s.price as service_price,
           t.name as tenant_name, t.slug as tenant_slug, t.address as tenant_address
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN tenants t ON t.id = b.tenant_id
    WHERE b.customer_id = $1
  `;
    const params = [customerId];
    let paramCount = 2;

    if (status) {
        sql += ` AND b.status = $${paramCount++}`;
        params.push(status);
    }

    sql += ` ORDER BY b.booking_date DESC, b.start_time DESC`;
    sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    const countResult = await query(
        'SELECT COUNT(*) FROM bookings WHERE customer_id = $1',
        [customerId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    return { bookings: result.rows, total };
};

/**
 * Find booking by ID
 */
export const findById = async (id) => {
    const result = await query(
        `SELECT b.*, 
            s.name as service_name, s.price as service_price,
            t.name as tenant_name, t.slug as tenant_slug,
            u.full_name as customer_name, u.email as customer_email
     FROM bookings b
     JOIN services s ON s.id = b.service_id
     JOIN tenants t ON t.id = b.tenant_id
     JOIN users u ON u.id = b.customer_id
     WHERE b.id = $1`,
        [id]
    );
    return result.rows[0] || null;
};

/**
 * Update booking status
 */
export const updateStatus = async (id, status, paymentStatus = null) => {
    let sql = 'UPDATE bookings SET status = $1';
    const params = [status];
    let paramCount = 2;

    if (paymentStatus) {
        sql += `, payment_status = $${paramCount++}`;
        params.push(paymentStatus);
    }

    sql += ` WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    const result = await query(sql, params);
    return result.rows[0];
};

/**
 * Cancel booking
 */
export const cancel = async (id, reason) => {
    // Get the booking first to release the slot
    const booking = await findById(id);

    if (!booking) return null;

    // Update booking status
    const result = await query(
        `UPDATE bookings 
     SET status = 'cancelled', 
         cancellation_reason = $1
     WHERE id = $2 
     RETURNING *`,
        [reason, id]
    );

    // Decrement slot booking count
    await slotsRepository.decrementBookedCount(booking.time_slot_id);

    return result.rows[0];
};

/**
 * Update payment info
 */
export const updatePayment = async (id, { paymentStatus, paymentIntentId }) => {
    const result = await query(
        `UPDATE bookings 
     SET payment_status = $1, payment_intent_id = $2
     WHERE id = $3 
     RETURNING *`,
        [paymentStatus, paymentIntentId, id]
    );
    return result.rows[0];
};

/**
 * Get dashboard stats for tenant
 */
export const getTenantStats = async (tenantId) => {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const result = await query(
        `SELECT 
       COUNT(*) FILTER (WHERE status = 'confirmed') as pending_count,
       COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
       COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
       COUNT(*) FILTER (WHERE booking_date = $2) as today_count,
       COUNT(*) FILTER (WHERE booking_date >= $2 AND status IN ('reserved', 'confirmed')) as upcoming_count,
       COALESCE(SUM(total_amount) FILTER (WHERE booking_date = $2 AND payment_status = 'paid'), 0) as today_revenue,
       COALESCE(SUM(total_amount) FILTER (WHERE booking_date >= $3 AND payment_status = 'paid'), 0) as monthly_revenue,
       COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed' AND payment_status = 'paid'), 0) as total_revenue
     FROM bookings
     WHERE tenant_id = $1`,
        [tenantId, today, startOfMonth]
    );

    return result.rows[0];
};

/**
 * Get today's schedule for tenant
 */
export const getTodaySchedule = async (tenantId) => {
    const today = new Date().toISOString().split('T')[0];

    const result = await query(
        `SELECT b.id, b.status, b.start_time, b.end_time,
                s.name as service_name,
                u.full_name as customer_name
         FROM bookings b
         JOIN services s ON s.id = b.service_id
         JOIN users u ON u.id = b.customer_id
         WHERE b.tenant_id = $1 
           AND b.booking_date = $2
           AND b.status NOT IN ('cancelled')
         ORDER BY b.start_time ASC`,
        [tenantId, today]
    );

    return result.rows;
};

export default {
    createWithLock,
    findByTenantId,
    findByCustomerId,
    findById,
    updateStatus,
    cancel,
    updatePayment,
    getTenantStats,
    getTodaySchedule,
};

