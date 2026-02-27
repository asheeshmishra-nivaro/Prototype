const axios = require('axios');

async function benchmark() {
    const baseURL = 'http://localhost:5000/api';
    console.log('[BENCHMARK] Starting Doctor Dashboard Performance Test');

    try {
        // 1. Login
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'doctor@nivaro.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // 2. Measure Dashboard Summary
        const start = Date.now();
        const iterations = 5;
        console.log(`[BENCHMARK] Running ${iterations} iterations for /api/doctor/dashboard-summary...`);

        for (let i = 0; i < iterations; i++) {
            await axios.get(`${baseURL}/doctor/dashboard-summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }

        const end = Date.now();
        const avgTime = (end - start) / iterations;
        console.log(`[BENCHMARK] Average Response Time: ${avgTime.toFixed(2)}ms`);

    } catch (err) {
        console.error('[BENCHMARK ERROR] Failed to run benchmark:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
}

benchmark();
