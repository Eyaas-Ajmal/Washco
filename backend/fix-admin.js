import argon2 from 'argon2';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/washco'
});

async function main() {
    try {
        // Generate proper hash
        const hash = await argon2.hash('admin123');
        console.log('Generated hash:', hash);

        // Update in database
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email',
            [hash, 'admin@washco.com']
        );

        if (result.rowCount > 0) {
            console.log('✅ Admin password updated successfully!');
        } else {
            console.log('❌ No user found with that email');
        }

        // Also approve all pending tenants for testing
        const tenantResult = await pool.query(
            "UPDATE tenants SET status = 'approved' WHERE status = 'pending' RETURNING name"
        );

        tenantResult.rows.forEach(t => {
            console.log(`✅ Approved: ${t.name}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

main();
