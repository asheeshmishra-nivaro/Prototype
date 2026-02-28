const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'db.cdiwjdsycvhbhhnqajxj.supabase.co',
    database: 'postgres',
    password: 'Ashish#220@j',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

async function test() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('[SUCCESS] Connected to Supabase:', res.rows[0].now);
    } catch (err) {
        console.error('[ERROR-DETAILED]', JSON.stringify({
            message: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint
        }, null, 2));
    } finally {
        await pool.end();
    }
}

test();
