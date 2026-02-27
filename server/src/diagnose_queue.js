const db = require('./db');

async function diagnose() {
    console.log('[DIAGNOSE] Checking Consultations Table...');
    try {
        const all = await db.query("SELECT * FROM consultations");
        console.log(`[DIAGNOSE] Total Consultations: ${all.rows.length}`);

        const pending = await db.query("SELECT * FROM consultations WHERE status = 'pending'");
        console.log(`[DIAGNOSE] Pending Consultations: ${pending.rows.length}`);

        if (pending.rows.length > 0) {
            console.log('[DIAGNOSE] Sample Pending Row:', JSON.stringify(pending.rows[0], null, 2));
        }

        const doctors = await db.query("SELECT id, name, role FROM users WHERE role = 'doctor'");
        console.log('[DIAGNOSE] Doctors in DB:', JSON.stringify(doctors.rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('[DIAGNOSE-ERROR]', err);
        process.exit(1);
    }
}

diagnose();
