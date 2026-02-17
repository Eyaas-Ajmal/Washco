import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    console.log('🚀 Starting database migration...');

    const client = await pool.connect();

    try {
        // Create migrations tracking table
        await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

        // Get executed migrations
        const { rows: executedMigrations } = await client.query(
            'SELECT name FROM migrations ORDER BY name'
        );
        const executedNames = new Set(executedMigrations.map(m => m.name));

        // Get migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            if (executedNames.has(file)) {
                console.log(`⏭️  Skipping ${file} (already executed)`);
                continue;
            }

            console.log(`📝 Executing ${file}...`);

            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');

            await client.query('BEGIN');

            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO migrations (name) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                console.log(`✅ ${file} executed successfully`);
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        }

        console.log('✨ All migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
