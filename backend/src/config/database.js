import pg from 'pg';
import config from './env.js';

const { Pool } = pg;

export const pool = new Pool({
    ...config.db,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('📦 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

/**
 * Execute a query with optional tenant isolation
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export const query = async (text, params) => {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (config.env === 'development') {
        console.log('📝 Query:', { text: text.substring(0, 100), duration: `${duration}ms`, rows: result.rowCount });
    }

    return result;
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<pg.PoolClient>}
 */
export const getClient = async () => {
    const client = await pool.connect();
    return client;
};

/**
 * Execute a transaction
 * @param {Function} callback - Function receiving client
 * @returns {Promise<any>}
 */
export const transaction = async (callback) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export default { pool, query, getClient, transaction };
