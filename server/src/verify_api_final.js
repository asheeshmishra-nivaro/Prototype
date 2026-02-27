const db = require('./db');
const controller = require('./controllers/adminController');

async function simulate() {
    const req = { query: { period: 'month' } };
    const res = {
        json: (data) => {
            console.log("--- FINAL API VERIFICATION ---");
            console.log(JSON.stringify(data, null, 2));
            process.exit(0);
        },
        status: (code) => ({
            json: (data) => {
                console.log("--- ERROR RESPONSE ---");
                console.log("Status:", code);
                console.log(JSON.stringify(data, null, 2));
                process.exit(1);
            }
        })
    };

    console.log("Invoking getDashboardSummary simulated...");
    await controller.getDashboardSummary(req, res);
}

simulate().catch(e => {
    console.error(e);
    process.exit(1);
});
