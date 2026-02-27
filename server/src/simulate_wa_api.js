const db = require('./db');
const controller = require('./controllers/whatsappController');

async function simulate() {
    const req = { query: { filter: 'today' } };
    const res = {
        json: (data) => {
            console.log("--- WHATSAPP ANALYTICS RESPONSE ---");
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

    console.log("Invoking getAnalytics simulated...");
    await controller.getAnalytics(req, res);
}

simulate().catch(e => {
    console.error(e);
    process.exit(1);
});
