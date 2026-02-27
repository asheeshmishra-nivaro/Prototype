const db = require('./db');

async function verify() {
    console.log('[VERIFICATION] Auditing Operational Metrics...');

    // 1. Transaction Counts
    const countRes = await db.query("SELECT COUNT(*) as total FROM financial_transactions");
    console.log(`- Total Transactions: ${countRes.rows[0].total}`);

    // 2. Node Distribution (Target: 45/35/20)
    const nodeRes = await db.query(`
        SELECT node_id, 
               COUNT(*) * 100.0 / (SELECT COUNT(*) FROM financial_transactions WHERE transaction_type != 'inventory_purchase') as percent 
        FROM financial_transactions 
        WHERE transaction_type != 'inventory_purchase'
        GROUP BY node_id
    `);
    console.log('- Node Distribution:');
    nodeRes.rows.forEach(r => console.log(`  ${r.node_id}: ${r.percent.toFixed(1)}%`));

    // 3. Averages (Target: 350 / 420)
    const avgRes = await db.query(`
        SELECT transaction_type, AVG(amount) as avg_amount
        FROM financial_transactions 
        WHERE transaction_type != 'inventory_purchase'
        GROUP BY transaction_type
    `);
    console.log('- Financial Averages:');
    avgRes.rows.forEach(r => console.log(`  ${r.transaction_type}: ₹${r.avg_amount.toFixed(1)}`));

    // 4. Monthly Revenue (Target: 28.4L - 34L)
    const revRes = await db.query(`
        SELECT SUM(amount) as total 
        FROM financial_transactions 
        WHERE transaction_type IN ('consultation', 'medicine_sale')
        AND timestamp >= date('now', '-30 days')
    `);
    console.log(`- Last 30d Revenue: ₹${(revRes.rows[0].total || 0).toLocaleString()}`);

    // 5. Margin % (Target: 22% - 27%)
    const marginRes = await db.query(`
        SELECT (SUM(margin) / SUM(amount)) * 100 as margin_pct
        FROM financial_transactions 
        WHERE transaction_type IN ('consultation', 'medicine_sale')
        AND timestamp >= date('now', '-30 days')
    `);
    console.log(`- Operational Margin: ${marginRes.rows[0].margin_pct.toFixed(1)}%`);
}

verify();
