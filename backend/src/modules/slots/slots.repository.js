import { query } from '../../config/database.js';

/**
 * Find slots for a tenant and date range
 */
export const findByTenantAndDateRange = async (tenantId, startDate, endDate, status = null) => {
    let sql = `
    SELECT * FROM time_slots 
    WHERE tenant_id = $1 
    AND slot_date::date >= $2::date 
    AND slot_date::date <= $3::date
  `;
    const params = [tenantId, startDate, endDate];

    if (status) {
        sql += ' AND status = $4';
        params.push(status);
    }

    sql += ' ORDER BY slot_date, start_time';

    const result = await query(sql, params);
    return result.rows;
};

/**
 * Find slot by ID
 */
export const findById = async (id) => {
    const result = await query('SELECT * FROM time_slots WHERE id = $1', [id]);
    return result.rows[0] || null;
};

/**
 * Find slot by tenant, date, and time (for avoiding duplicates)
 */
export const findByTenantDateTime = async (tenantId, slotDate, startTime) => {
    const result = await query(
        `SELECT * FROM time_slots 
     WHERE tenant_id = $1 AND slot_date = $2 AND start_time = $3`,
        [tenantId, slotDate, startTime]
    );
    return result.rows[0] || null;
};

/**
 * Find slot by ID with lock (FOR UPDATE)
 */
export const findByIdWithLock = async (client, id) => {
    const result = await client.query(
        'SELECT * FROM time_slots WHERE id = $1 FOR UPDATE',
        [id]
    );
    return result.rows[0] || null;
};

/**
 * Create slot
 */
export const create = async ({ tenantId, slotDate, startTime, endTime, maxCapacity }) => {
    const result = await query(
        `INSERT INTO time_slots (tenant_id, slot_date, start_time, end_time, max_capacity)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tenant_id, slot_date, start_time) DO NOTHING
     RETURNING *`,
        [tenantId, slotDate, startTime, endTime, maxCapacity]
    );
    return result.rows[0];
};

/**
 * Bulk create slots
 */
export const bulkCreate = async (slots) => {
    if (slots.length === 0) return [];

    const values = slots.map((s, i) => {
        const base = i * 5;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    }).join(', ');

    const params = slots.flatMap(s => [
        s.tenantId, s.slotDate, s.startTime, s.endTime, s.maxCapacity
    ]);

    const result = await query(
        `INSERT INTO time_slots (tenant_id, slot_date, start_time, end_time, max_capacity)
     VALUES ${values}
     ON CONFLICT (tenant_id, slot_date, start_time) DO NOTHING
     RETURNING *`,
        params
    );

    return result.rows;
};

/**
 * Update slot
 */
export const update = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMappings = {
        maxCapacity: 'max_capacity',
        status: 'status',
    };

    for (const [key, dbField] of Object.entries(fieldMappings)) {
        if (data[key] !== undefined) {
            fields.push(`${dbField} = $${paramCount++}`);
            values.push(data[key]);
        }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
        `UPDATE time_slots SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
    );
    return result.rows[0];
};

/**
 * Increment booked count (used within transaction)
 */
export const incrementBookedCount = async (client, id) => {
    const result = await client.query(
        `UPDATE time_slots 
     SET booked_count = booked_count + 1,
         status = CASE WHEN booked_count + 1 >= max_capacity THEN 'full' ELSE status END
     WHERE id = $1 
     RETURNING *`,
        [id]
    );
    return result.rows[0];
};

/**
 * Decrement booked count
 */
export const decrementBookedCount = async (id) => {
    const result = await query(
        `UPDATE time_slots 
     SET booked_count = GREATEST(0, booked_count - 1),
         status = CASE WHEN booked_count - 1 < max_capacity THEN 'available' ELSE status END
     WHERE id = $1 
     RETURNING *`,
        [id]
    );
    return result.rows[0];
};

/**
 * Block slot
 */
export const blockSlot = async (id) => {
    const result = await query(
        "UPDATE time_slots SET status = 'blocked' WHERE id = $1 RETURNING *",
        [id]
    );
    return result.rows[0];
};

/**
 * Unblock slot
 */
export const unblockSlot = async (id) => {
    const result = await query(
        `UPDATE time_slots 
     SET status = CASE WHEN booked_count >= max_capacity THEN 'full' ELSE 'available' END
     WHERE id = $1 
     RETURNING *`,
        [id]
    );
    return result.rows[0];
};

/**
 * Delete slots by date range
 */
export const deleteByDateRange = async (tenantId, startDate, endDate) => {
    // Only delete slots with no bookings
    await query(
        `DELETE FROM time_slots 
     WHERE tenant_id = $1 
     AND slot_date >= $2 
     AND slot_date <= $3
     AND booked_count = 0`,
        [tenantId, startDate, endDate]
    );
};

/**
 * Get operating hours for tenant
 */
export const getOperatingHours = async (tenantId) => {
    const result = await query(
        'SELECT * FROM operating_hours WHERE tenant_id = $1 ORDER BY day_of_week',
        [tenantId]
    );
    return result.rows;
};

/**
 * Set operating hours
 */
export const setOperatingHours = async (tenantId, hours) => {
    // Delete existing
    await query('DELETE FROM operating_hours WHERE tenant_id = $1', [tenantId]);

    // Insert new
    for (const h of hours) {
        await query(
            `INSERT INTO operating_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
       VALUES ($1, $2, $3, $4, $5)`,
            [tenantId, h.dayOfWeek, h.openTime, h.closeTime, h.isClosed || false]
        );
    }

    return await getOperatingHours(tenantId);
};

export default {
    findByTenantAndDateRange,
    findById,
    findByTenantDateTime,
    findByIdWithLock,
    create,
    bulkCreate,
    update,
    incrementBookedCount,
    decrementBookedCount,
    blockSlot,
    unblockSlot,
    deleteByDateRange,
    getOperatingHours,
    setOperatingHours,
};
