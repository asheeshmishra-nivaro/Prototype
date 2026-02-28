const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Ashish%23220%40j@db.cdiwjdsycvhbhhnqajxj.supabase.co:5432/postgres?sslmode=require',
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    console.log('[MIGRATE] Starting database migration to PostgreSQL...');
    const schemaPath = path.resolve(__dirname, '../server/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    try {
        await pool.query(schema);
        console.log('[MIGRATE] Schema applied successfully.');
    } catch (err) {
        console.error('[MIGRATE-ERROR] Failed to apply schema:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
