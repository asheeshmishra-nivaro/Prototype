const db = require('./db');
async function run() {
    console.log("--- DB Diagnostic ---");
    const count = await db.query("SELECT COUNT(*) as count FROM financial_transactions");
    console.log("Total Count:", count.rows[0].count);

    const types = await db.query("SELECT DISTINCT transaction_type FROM financial_transactions");
    console.log("Types in DB:", types.rows.map(r => r.transaction_type));

    const range = await db.query("SELECT MIN(timestamp) as min_ts, MAX(timestamp) as max_ts FROM financial_transactions");
    console.log("TS Range:", range.rows[0]);

    const revCheck = await db.query("SELECT SUM(amount) FROM financial_transactions WHERE transaction_type IN ('consultation', 'medicine_sale')");
    console.log("Revenue Check (Direct):", revCheck.rows[0]);

    const sqliteNow = await db.query("SELECT datetime('now') as now, datetime('now', '-90 days') as ninety_ago");
    console.log("SQLite Time Context:", sqliteNow.rows[0]);
}
run().catch(console.error);
