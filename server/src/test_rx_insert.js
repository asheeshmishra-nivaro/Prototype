const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function testRxInsert() {
    try {
        const id = uuidv4();
        const consultation_id = 'c101'; // Should exist from seeder
        const prescription_id = 'NV-TEST-' + Math.floor(Math.random() * 1000);
        const doctor_id = 'doc-101';
        const patient_id = 'p101';
        const medicines = JSON.stringify([{ name: 'Med A' }]);
        const instructions = 'Test instructions';

        console.log('[TEST] Attempting RX INSERT...');
        const res = await db.query(`
            INSERT INTO prescriptions (id, consultation_id, prescription_id, doctor_id, patient_id, medicines, instructions)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [id, consultation_id, prescription_id, doctor_id, patient_id, medicines, instructions]);

        console.log('[TEST] RX INSERT Success:', res);
        process.exit(0);
    } catch (err) {
        console.error('[TEST] RX INSERT Failed:', err.message);
        process.exit(1);
    }
}

testRxInsert();
