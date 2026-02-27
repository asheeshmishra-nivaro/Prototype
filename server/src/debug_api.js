const axios = require('axios');

async function debugSearch() {
    const baseURL = 'http://localhost:5000/api';
    console.log('[DEBUG] Testing API Medicine Search');

    try {
        // 1. Login
        console.log('[1] Attempting Login...');
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'doctor@nivaro.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('[SUCCESS] Logged in. Token received.');

        // 2. Search
        const query = 'ace';
        console.log(`[2] Searching for "${query}"...`);
        const searchRes = await axios.get(`${baseURL}/inventory/search?q=${query}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('[SUCCESS] Search completed.');
        console.log('Response Status:', searchRes.status);
        console.log('Results Count:', searchRes.data.length);
        console.log('Data Preview:', JSON.stringify(searchRes.data.slice(0, 2), null, 2));

    } catch (err) {
        console.error('[ERROR] Debug failed');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Message:', err.message);
        }
    }
}

debugSearch();
