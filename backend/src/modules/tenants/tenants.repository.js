import { query, transaction } from '../../config/database.js';

/**
 * Find all tenants (with optional filters)
 */
export const findAll = async ({ status, search, limit = 20, offset = 0 }) => {
    let sql = `
    SELECT t.*, 
           u.full_name as owner_name,
           u.email as owner_email,
           COALESCE(AVG(r.rating), 0) as avg_rating,
           COUNT(DISTINCT r.id) as review_count
    FROM tenants t
    LEFT JOIN users u ON u.id = t.owner_id
    LEFT JOIN reviews r ON r.tenant_id = t.id AND r.is_visible = TRUE
  `;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (status) {
        conditions.push(`t.status = $${paramCount++}`);
        params.push(status);
    }

    if (search) {
        conditions.push(`(t.name ILIKE $${paramCount} OR t.address ILIKE $${paramCount})`);
        params.push(`%${search}%`);
        paramCount++;
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY t.id, u.id';
    sql += ` ORDER BY t.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) FROM tenants t';
    if (conditions.length > 0) {
        countSql += ' WHERE ' + conditions.join(' AND ');
    }
    const countParams = params.slice(0, -2);
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    return { tenants: result.rows, total };
};

/**
 * Find tenant by ID or slug
 */
export const findByIdOrSlug = async (identifier) => {
    const result = await query(
        `SELECT t.*, 
            u.full_name as owner_name,
            COALESCE(AVG(r.rating), 0) as avg_rating,
            COUNT(DISTINCT r.id) as review_count
     FROM tenants t
     LEFT JOIN users u ON u.id = t.owner_id
     LEFT JOIN reviews r ON r.tenant_id = t.id AND r.is_visible = TRUE
     WHERE t.id::text = $1 OR t.slug = $1
     GROUP BY t.id, u.id`,
        [identifier]
    );
    return result.rows[0] || null;
};

/**
 * Find tenant by owner ID
 */
export const findByOwnerId = async (ownerId) => {
    const result = await query(
        'SELECT * FROM tenants WHERE owner_id = $1',
        [ownerId]
    );
    return result.rows[0] || null;
};

/**
 * Create tenant
 */
export const create = async ({ name, slug, description, address, latitude, longitude, phone, email, ownerId }) => {
    const result = await query(
        `INSERT INTO tenants (name, slug, description, address, latitude, longitude, phone, email, owner_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
     RETURNING *`,
        [name, slug, description, address, latitude, longitude, phone, email, ownerId]
    );
    return result.rows[0];
};

/**
 * Update tenant
 */
export const update = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['name', 'description', 'address', 'latitude', 'longitude', 'phone', 'email', 'settings', 'image_url'];

    for (const [key, value] of Object.entries(data)) {
        if (allowedFields.includes(key) && value !== undefined) {
            fields.push(`${key} = $${paramCount++}`);
            values.push(key === 'settings' ? JSON.stringify(value) : value);
        }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
        `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
    );
    return result.rows[0];
};

/**
 * Update tenant status (admin only)
 */
export const updateStatus = async (id, status) => {
    const result = await query(
        'UPDATE tenants SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
    );
    return result.rows[0];
};

/**
 * Generate unique slug
 */
export const generateUniqueSlug = async (name) => {
    const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const result = await query('SELECT id FROM tenants WHERE slug = $1', [slug]);
        if (result.rows.length === 0) {
            return slug;
        }
        slug = `${baseSlug}-${counter++}`;
    }
};

export default {
    findAll,
    findByIdOrSlug,
    findByOwnerId,
    create,
    update,
    updateStatus,
    generateUniqueSlug,
};
