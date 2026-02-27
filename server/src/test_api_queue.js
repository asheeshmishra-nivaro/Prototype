const axios = require('axios');

async function testApi() {
    try {
        console.log('[TEST-API] Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'doctor@nivaro.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('[TEST-API] Login successful. Token obtained.');

        console.log('[TEST-API] Fetching queue...');
        const queueRes = await axios.get('http://localhost:5000/api/consultations/queue', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log(`[TEST-API] Queue Length: ${queueRes.data.length}`);
        if (queueRes.data.length > 0) {
            console.log('[TEST-API] Sample Patient:', queueRes.data[0].patient_name);
        } else {
            console.log('[TEST-API] Queue is EMPTY.');
        }

        process.exit(0);
    } catch (err) {
        console.error('[TEST-API-ERROR]', err.response?.data || err.message);
        process.exit(1);
    }
}

testApi();
