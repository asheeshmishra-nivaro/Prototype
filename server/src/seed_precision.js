const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function seed() {
    console.log('[SEED] Starting Non-Random Precision Seed...');
    await db.query("DELETE FROM financial_transactions");

    const targetRevenue = 2956000;
    const targetMargin = 2000678;
    const now = new Date();

    // We'll create exactly 10 transactions that sum to the totals
    // This makes debugging much easier.
    const nodes = ['alpha', 'beta', 'gamma'];
    const nodeWeights = [0.45, 0.35, 0.20];

    for (let i = 0; i < nodes.length; i++) {
        const nodeRev = targetRevenue * nodeWeights[i];
        const nodeMargin = targetMargin * nodeWeights[i];

        // Split each node into 2 transactions: Consultation and Medicines
        const consultRev = nodeRev * 0.4;
        const medicineRev = nodeRev * 0.6;
        const consultMargin = nodeMargin * 0.4;
        const medicineMargin = nodeMargin * 0.6;

        const timestamp = new Date(now);
        timestamp.setHours(timestamp.getHours() - (i * 2)); // Spread over today

        // 1. Consultation
        await db.query(`
            INSERT INTO financial_transactions (id, transaction_type, node_id, amount, cost, margin, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [uuidv4(), 'consultation', nodes[i], consultRev, consultRev - consultMargin, consultMargin, timestamp.toISOString()]);

        // 2. Medicine Sale
        await db.query(`
            INSERT INTO financial_transactions (id, transaction_type, node_id, amount, cost, margin, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [uuidv4(), 'medicine_sale', nodes[i], medicineRev, medicineRev - medicineMargin, medicineMargin, timestamp.toISOString()]);

        console.log(`Seeded ${nodes[i]}: Rev=${nodeRev.toFixed(0)}, Margin=${nodeMargin.toFixed(0)}`);
    }

    console.log(`[SEED-SUCCESS] Precision targets hit.`);
}

seed();
