const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres.cdiwjdsycvhbhhnqajxj:Ashish%23220%40j@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    console.log('[MIGRATE] Starting database migration to PostgreSQL (Pooled)...');
    // Note: Use the host provided in the screenshot which is aws-1-ap-northeast-1.pooler.supabase.com
    const schemaPath = path.resolve(__dirname, 'db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    try {
        await pool.query(schema);
        console.log('[MIGRATE] Schema applied successfully.');
    } catch (err) {
        console.error('[MIGRATE-ERROR] Failed to apply schema:', err.message);
        console.error('[DETAIL]', err);
    } finally {
        await pool.end();
    }
}

migrate();
