import argon2 from 'argon2';
import { pool } from '../config/database.js';

async function seed() {
    console.log('🌱 Starting database seeding...');

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Create super admin
        const superAdminPassword = await argon2.hash('admin123456');
        const { rows: [superAdmin] } = await client.query(
            `INSERT INTO users (email, password_hash, full_name, role, is_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
            ['admin@washco.com', superAdminPassword, 'Super Admin', 'super_admin', true]
        );
        console.log('✅ Super admin created');

        // Create sample manager
        const managerPassword = await argon2.hash('manager123');
        const { rows: [manager] } = await client.query(
            `INSERT INTO users (email, password_hash, full_name, phone, role, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
            ['manager@sparklewash.com', managerPassword, 'John Manager', '+1234567890', 'manager', true]
        );
        console.log('✅ Sample manager created');

        // Create sample tenant (car wash)
        const { rows: [tenant] } = await client.query(
            `INSERT INTO tenants (name, slug, description, address, latitude, longitude, phone, email, status, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
            [
                'Sparkle Wash Premium',
                'sparkle-wash',
                'Premium car wash with eco-friendly products and expert detailing services.',
                '123 Main Street, Downtown, City, 12345',
                40.7128,
                -74.0060,
                '+1234567890',
                'info@sparklewash.com',
                'approved',
                manager.id
            ]
        );
        console.log('✅ Sample car wash created');

        // Update manager with tenant_id
        await client.query(
            'UPDATE users SET tenant_id = $1 WHERE id = $2',
            [tenant.id, manager.id]
        );

        // Create sample services
        const services = [
            { name: 'Basic Wash', description: 'Exterior wash with rinse and dry', price: 15.99, duration: 15, buffer: 5 },
            { name: 'Standard Wash', description: 'Exterior wash with interior vacuum and wipe down', price: 29.99, duration: 30, buffer: 10 },
            { name: 'Premium Detail', description: 'Full interior and exterior detailing with wax', price: 79.99, duration: 60, buffer: 15 },
            { name: 'Express Wax', description: 'Quick spray wax treatment', price: 19.99, duration: 10, buffer: 5 },
        ];

        for (let i = 0; i < services.length; i++) {
            const s = services[i];
            await client.query(
                `INSERT INTO services (tenant_id, name, description, price, duration_minutes, buffer_minutes, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [tenant.id, s.name, s.description, s.price, s.duration, s.buffer, i]
            );
        }
        console.log('✅ Sample services created');

        // Create operating hours (Mon-Sun, 8am-6pm, closed Sunday)
        const days = [
            { day: 0, open: '08:00', close: '18:00', closed: true },  // Sunday
            { day: 1, open: '08:00', close: '18:00', closed: false }, // Monday
            { day: 2, open: '08:00', close: '18:00', closed: false }, // Tuesday
            { day: 3, open: '08:00', close: '18:00', closed: false }, // Wednesday
            { day: 4, open: '08:00', close: '18:00', closed: false }, // Thursday
            { day: 5, open: '08:00', close: '18:00', closed: false }, // Friday
            { day: 6, open: '09:00', close: '17:00', closed: false }, // Saturday
        ];

        for (const d of days) {
            await client.query(
                `INSERT INTO operating_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
         VALUES ($1, $2, $3, $4, $5)`,
                [tenant.id, d.day, d.open, d.close, d.closed]
            );
        }
        console.log('✅ Operating hours created');

        // Create sample time slots for next 7 days
        const today = new Date();
        for (let d = 0; d < 7; d++) {
            const date = new Date(today);
            date.setDate(date.getDate() + d);
            const dayOfWeek = date.getDay();

            // Skip Sunday
            if (dayOfWeek === 0) continue;

            const openHour = dayOfWeek === 6 ? 9 : 8;
            const closeHour = dayOfWeek === 6 ? 17 : 18;

            for (let hour = openHour; hour < closeHour; hour++) {
                const slotDate = date.toISOString().split('T')[0];
                const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
                const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

                await client.query(
                    `INSERT INTO time_slots (tenant_id, slot_date, start_time, end_time, max_capacity)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
                    [tenant.id, slotDate, startTime, endTime, 3]
                );
            }
        }
        console.log('✅ Time slots created for next 7 days');

        // Create sample customer
        const customerPassword = await argon2.hash('customer123');
        const { rows: [customer] } = await client.query(
            `INSERT INTO users (email, password_hash, full_name, phone, role, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
            ['customer@example.com', customerPassword, 'Jane Customer', '+0987654321', 'customer', true]
        );
        console.log('✅ Sample customer created');

        await client.query('COMMIT');
        console.log('\n✨ Database seeding completed successfully!');
        console.log('\n📋 Test Accounts:');
        console.log('   Super Admin: admin@washco.com / admin123456');
        console.log('   Manager: manager@sparklewash.com / manager123');
        console.log('   Customer: customer@example.com / customer123');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
