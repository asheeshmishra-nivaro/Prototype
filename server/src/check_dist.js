const db = require('./db');
async function run() {
    console.log("--- Type Distribution ---");
    const types = await db.query("SELECT transaction_type, COUNT(*) as count, SUM(amount) as total FROM financial_transactions GROUP BY transaction_type");
    console.log(JSON.stringify(types.rows, null, 2));

    console.log("\n--- Daily Distribution (Last 5 days) ---");
    const daily = await db.query("SELECT date(timestamp) as day, COUNT(*) as count, SUM(amount) as total FROM financial_transactions GROUP BY day ORDER BY day DESC LIMIT 5");
    console.log(JSON.stringify(daily.rows, null, 2));

    console.log("\n--- 30 Day Filter Check ---");
    const filter = await db.query("SELECT COUNT(*) as count, SUM(amount) as total FROM financial_transactions WHERE timestamp >= date('now', '-30 days')");
    console.log(JSON.stringify(filter.rows, null, 2));
}
run();
