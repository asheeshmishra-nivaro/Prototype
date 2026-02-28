const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://postgres.cdiwjdsycvhbhhnqajxj:Ashish%23220%40j@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    console.log('[SEED] Starting user population...');
    const passwordHash = bcrypt.hashSync('admin123', 10);

    const users = [
        ['Nivaro Admin', 'admin@nivaro.com', passwordHash, 'admin'],
        ['Dr. Amartya Sen', 'doctor@nivaro.com', passwordHash, 'doctor'],
        ['Village Operator John', 'operator@nivaro.com', passwordHash, 'operator']
    ];

    try {
        for (const [name, email, hash, role] of users) {
            await pool.query(
                'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET password_hash = $3',
                [name, email, hash, role]
            );
            console.log(`[SEED] Ensured user: ${email}`);
        }
        console.log('[SEED] Successfully seeded users.');
    } catch (err) {
        console.error('[SEED-ERROR]', err);
    } finally {
        await pool.end();
    }
}

seed();
