import { query } from '../../config/database.js';

/**
 * Find all services for a tenant
 */
export const findByTenantId = async (tenantId, includeInactive = false) => {
    let sql = `
    SELECT * FROM services 
    WHERE tenant_id = $1
  `;

    if (!includeInactive) {
        sql += ' AND is_active = TRUE';
    }

    sql += ' ORDER BY sort_order, created_at';

    const result = await query(sql, [tenantId]);
    return result.rows;
};

/**
 * Find service by ID
 */
export const findById = async (id) => {
    const result = await query('SELECT * FROM services WHERE id = $1', [id]);
    return result.rows[0] || null;
};

/**
 * Create service
 */
export const create = async ({ tenantId, name, description, price, durationMinutes, bufferMinutes, sortOrder }) => {
    const result = await query(
        `INSERT INTO services (tenant_id, name, description, price, duration_minutes, buffer_minutes, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
        [tenantId, name, description, price, durationMinutes, bufferMinutes || 0, sortOrder || 0]
    );
    return result.rows[0];
};

/**
 * Update service
 */
export const update = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMappings = {
        name: 'name',
        description: 'description',
        price: 'price',
        durationMinutes: 'duration_minutes',
        bufferMinutes: 'buffer_minutes',
        isActive: 'is_active',
        sortOrder: 'sort_order',
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
        `UPDATE services SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
    );
    return result.rows[0];
};

/**
 * Delete service (soft delete by deactivating)
 */
export const remove = async (id) => {
    const result = await query(
        'UPDATE services SET is_active = FALSE WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
};

/**
 * Hard delete service (only if no bookings)
 */
export const hardDelete = async (id) => {
    // Check for bookings
    const bookings = await query(
        'SELECT id FROM bookings WHERE service_id = $1 LIMIT 1',
        [id]
    );

    if (bookings.rows.length > 0) {
        return false; // Cannot delete, has bookings
    }

    await query('DELETE FROM services WHERE id = $1', [id]);
    return true;
};

export default {
    findByTenantId,
    findById,
    create,
    update,
    remove,
    hardDelete,
};
