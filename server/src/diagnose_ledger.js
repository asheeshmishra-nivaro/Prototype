const db = require('./db');
async function diagnose() {
    try {
        const rows = await db.query("SELECT transaction_type, COUNT(*) as count, SUM(amount) as total FROM financial_transactions GROUP BY transaction_type");
        console.log("Groups:", JSON.stringify(rows.rows, null, 2));

        const dates = await db.query("SELECT MIN(timestamp) as min_ts, MAX(timestamp) as max_ts FROM financial_transactions");
        console.log("Date Range:", JSON.stringify(dates.rows, null, 2));

        const filterTest = await db.query("SELECT COUNT(*) as count, SUM(amount) as total FROM financial_transactions WHERE timestamp >= date('now', '-30 days')");
        console.log("30-Day Filter Test:", JSON.stringify(filterTest.rows, null, 2));

        const nowTest = await db.query("SELECT date('now', '-30 days') as thirty_days_ago");
        console.log("SQLite 30-Day Threshold:", JSON.stringify(nowTest.rows, null, 2));

        const fullSet = await db.query("SELECT SUM(amount) as total FROM financial_transactions");
        console.log("Grand Total:", JSON.stringify(fullSet.rows, null, 2));
    } catch (e) {
        console.error(e);
    }
}
diagnose();
