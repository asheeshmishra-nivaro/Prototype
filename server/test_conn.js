const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:Ashish%23220%40j@db.cdiwjdsycvhbhhnqajxj.supabase.co:5432/postgres?sslmode=require',
    ssl: {
        rejectUnauthorized: false
    }
});

async function test() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('[SUCCESS] Connected to Supabase:', res.rows[0].now);
    } catch (err) {
        console.error('[ERROR] Supabase connection failed:', err.message);
    } finally {
        await pool.end();
    }
}

test();
