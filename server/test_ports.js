const { Pool } = require('pg');
const ports = [5432, 6543];
const host = 'db.cdiwjdsycvhbhhnqajxj.supabase.co';

async function testPorts() {
    for (const port of ports) {
        console.log(`[TEST] Trying port ${port}...`);
        const pool = new Pool({
            user: 'postgres',
            host: host,
            database: 'postgres',
            password: 'Ashish#220@j',
            port: port,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });

        try {
            const res = await pool.query('SELECT NOW()');
            console.log(`[SUCCESS] Connected to Supabase on port ${port}:`, res.rows[0].now);
            break;
        } catch (err) {
            console.error(`[ERROR] Port ${port} failed:`, err.message);
        } finally {
            await pool.end();
        }
    }
}

testPorts();
