const db = require('./db');
const controller = require('./controllers/whatsappController');

async function testAll() {
    const req = { query: { filter: 'today' } };
    const res = {
        json: (data) => data,
        status: (code) => ({ json: (data) => { throw new Error(`Status ${code}: ${JSON.stringify(data)}`); } })
    };

    try {
        console.log("Testing getAnalytics...");
        const ana = await controller.getAnalytics(req, res);
        console.log("Analytics OK");

        console.log("Testing getEmergencyLogs...");
        const em = await controller.getEmergencyLogs(req, res);
        console.log("Emergency OK");

        console.log("Testing getBroadcastCampaigns...");
        const camp = await controller.getBroadcastCampaigns(req, res);
        console.log("Campaigns OK");

        console.log("ALL TESTS PASSED");
    } catch (e) {
        console.error("TEST FAILED:", e.message);
    }
}

testAll();
