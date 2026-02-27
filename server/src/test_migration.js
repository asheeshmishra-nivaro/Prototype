const axios = require('axios');
const db = require('./db');
const fs = require('fs');

async function testMigration() {
    try {
        console.log('[TEST-MIGRATION] Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'operator@nivaro.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('[TEST-MIGRATION] Login successful.');

        // 1. Start Consultation
        console.log('[TEST-MIGRATION] Starting consultation...');
        const startRes = await axios.post('http://localhost:5000/api/consultations/start', {
            patient_id: 'p101',
            vitals: { spo2: 98, bp_systolic: 120, bp_diastolic: 80, temp: 98.6, glucose: 100 },
            village_id: 'v1',
            doctor_id: 'doc-101',
            fee: 100
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const consultationId = startRes.data.id;
        console.log('[TEST-MIGRATION] Consultation created:', consultationId);

        // Verify in DB
        const dbCons = await db.query("SELECT * FROM consultations WHERE id = $1", [consultationId]);
        console.log('[TEST-MIGRATION] DB Consultation status:', dbCons.rows[0]?.status);

        // 2. Save Prescription
        // Need to login as doctor
        console.log('[TEST-MIGRATION] Logging in as doctor...');
        const docLoginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'doctor@nivaro.com',
            password: 'admin123'
        });
        const docToken = docLoginRes.data.token;

        console.log('[TEST-MIGRATION] Saving prescription...');
        const rxRes = await axios.post('http://localhost:5000/api/consultations/prescription', {
            consultation_id: consultationId,
            patient_id: 'p101',
            medicines: [{
                name: 'Paracetamol',
                morning: { enabled: true },
                afternoon: { enabled: false },
                evening: { enabled: true },
                night: { enabled: false },
                duration_days: 5,
                food_relation: 'After Food'
            }],
            instructions: 'Take after food',
            doctor_info: { license_number: 'MC2026' }
        }, {
            headers: { 'Authorization': `Bearer ${docToken}` }
        });
        console.log('[TEST-MIGRATION] Prescription saved:', rxRes.data.prescription_id);

        // Verify Status and Prescription in DB
        const dbConsAfter = await db.query("SELECT * FROM consultations WHERE id = $1", [consultationId]);
        console.log('[TEST-MIGRATION] DB Status after Rx:', dbConsAfter.rows[0]?.status);

        const dbRx = await db.query("SELECT * FROM prescriptions WHERE consultation_id = $1", [consultationId]);
        console.log('[TEST-MIGRATION] Prescription in DB:', dbRx.rows.length === 1 ? 'YES' : 'NO');

        const results = {
            consultationCreated: consultationId,
            dbStatus: dbConsAfter.rows[0]?.status,
            rxSaved: dbRx.rows.length === 1
        };
        fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
        console.log('[TEST-MIGRATION] Results saved to test_results.json');
        process.exit(0);
    } catch (err) {
        const errorData = err.response?.data || err.message;
        console.error('[TEST-MIGRATION-ERROR]', errorData);
        fs.writeFileSync('test_results.json', JSON.stringify({ error: errorData }, null, 2));
        process.exit(1);
    }
}

testMigration();
