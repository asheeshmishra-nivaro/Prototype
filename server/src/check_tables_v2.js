const db = require('./db');
async function run() {
    const tables = [
        'users', 'villages', 'patients', 'medicines', 'consultations',
        'prescriptions', 'payments', 'audit_logs', 'financial_transactions',
        'inventory_batches', 'stock_movements', 'vendors', 'purchase_orders'
    ];

    console.log("--- TABLE EXISTENCE CHECK ---");
    for (const t of tables) {
        try {
            await db.query(`SELECT 1 FROM ${t} LIMIT 1`);
            console.log(`[OK] ${t} exists.`);
        } catch (e) {
            console.log(`[MISSING] ${t} - Error: ${e.message}`);
        }
    }
}
run();
