const db = require('./db');
async function test() {
    const timeFilter = "timestamp >= datetime('now', '-90 days')";
    try {
        console.log("Testing Revenue Query...");
        const res = await db.query(`
            SELECT 
                SUM(CASE WHEN LOWER(TRIM(transaction_type)) IN ('consultation', 'medicine_sale') THEN amount ELSE 0 END) as revenue,
                SUM(margin) as margin,
                SUM(CASE WHEN LOWER(TRIM(transaction_type)) = 'consultation' THEN amount ELSE 0 END) as consult_rev,
                SUM(CASE WHEN LOWER(TRIM(transaction_type)) = 'medicine_sale' THEN amount ELSE 0 END) as medicine_rev,
                SUM(CASE WHEN LOWER(TRIM(transaction_type)) = 'inventory_purchase' THEN amount ELSE 0 END) as inventory_cost
            FROM financial_transactions 
            WHERE ${timeFilter}
        `);
        console.log("Revenue Result:", JSON.stringify(res.rows, null, 2));

        console.log("Testing Audit Query...");
        const aud = await db.query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 20");
        console.log("Audit Result Count:", aud.rows.length);

        console.log("SUCCESS");
    } catch (e) {
        console.error("FAILURE:", e.message);
    }
}
test();
