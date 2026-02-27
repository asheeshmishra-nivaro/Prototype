const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function testInsert() {
    try {
        const id = uuidv4();
        const patient_id = 'p101';
        const operator_id = 'op-201';
        const doctor_id = 'doc-101';
        const vitals = JSON.stringify({ spo2: 98 });
        const fee = 100;

        console.log('[TEST] Attempting INSERT...');
        const res = await db.query(`
            INSERT INTO consultations (id, patient_id, operator_id, doctor_id, vitals, status, fee, start_time)
            VALUES ($1, $2, $3, $4, $5, 'in_progress', $6, CURRENT_TIMESTAMP)
        `, [id, patient_id, operator_id, doctor_id, vitals, fee]);

        console.log('[TEST] INSERT Success:', res);
        process.exit(0);
    } catch (err) {
        console.error('[TEST] INSERT Failed:', err.message);
        process.exit(1);
    }
}

testInsert();
