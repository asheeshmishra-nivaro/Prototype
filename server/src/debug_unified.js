const db = require('./db');
const axios = require('axios');

async function debugUnified() {
    try {
        console.log('--- UNIFIED DEBUG ---');

        // 1. Direct DB Check
        const dbRes = await db.query("SELECT COUNT(*) as count FROM consultations WHERE status='pending'");
        console.log('[DB] Pending Consultations in File:', dbRes.rows[0].count);

        // 2. API Check
        console.log('[API] Logging in as doctor@nivaro.com...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'doctor@nivaro.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        const doctorId = loginRes.data.user.id;
        console.log('[API] Logged in. Doctor ID:', doctorId);

        const apiRes = await axios.get('http://localhost:5000/api/consultations/queue', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('[API] Queue returned:', apiRes.data.length, 'rows');

        if (apiRes.data.length === 0 && dbRes.rows[0].count > 0) {
            console.log('--- REASONING ---');
            console.log('Database has data, but API does not.');
            console.log('Checking if doctor IDs match...');
            const dbDoctors = await db.query("SELECT DISTINCT doctor_id FROM consultations WHERE status='pending'");
            console.log('Doctor IDs in DB pending consultations:', dbDoctors.rows.map(r => r.doctor_id));

            if (!dbDoctors.rows.map(r => r.doctor_id).includes(doctorId)) {
                console.log('ALERT! Doctor ID mismatch.');
            } else {
                console.log('Doctor IDs match. Join failure? Status mismatch?');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Unified Debug Failed:', err.message);
        process.exit(1);
    }
}

debugUnified();
