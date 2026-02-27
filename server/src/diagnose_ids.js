const db = require('./db');

async function diagnose() {
    console.log('--- DETAILED QUEUE DIAGNOSIS ---');
    try {
        const doctors = await db.query("SELECT id, name, email FROM users WHERE role = 'doctor'");
        console.log('Doctors in User Table:', doctors.rows);

        const pending = await db.query("SELECT id, doctor_id, patient_id, status FROM consultations WHERE status = 'pending'");
        console.log('Pending Consultations Count:', pending.rows.length);
        if (pending.rows.length > 0) {
            console.log('Sample Pending Doctors:', pending.rows.map(r => r.doctor_id));
        }

        // Check if there's any active token/session doctor id mismatch
        // (This would be verified by looking at the controller's req.user.id)

        const q = await db.query(`
            SELECT 
                c.id, 
                c.doctor_id,
                p.name as patient_name, 
                c.status
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            WHERE c.status = 'pending'
        `);
        console.log('Join Result (Pending):', q.rows.length);
        if (q.rows.length === 0) {
            console.log('DEBUG: Join failed. Checking if patients exist.');
            const pCount = await db.query("SELECT COUNT(*) as count FROM patients");
            console.log('Patient Count:', pCount.rows[0].count);
        }

        process.exit(0);
    } catch (err) {
        console.error('DIAGNOSIS FAILED:', err);
        process.exit(1);
    }
}

diagnose();
