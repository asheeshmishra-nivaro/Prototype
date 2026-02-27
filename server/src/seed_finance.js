const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function seed() {
    console.log('[SEED] Starting Financial Upscale (6000+ records)...');

    // 1. Clear existing data
    await db.query("DELETE FROM financial_transactions");

    const targetRevenue = 2956000;
    const targetMargin = 2000678;

    const nodes = [
        { id: 'alpha', name: 'Village Alpha', weight: 0.45 },
        { id: 'beta', name: 'Village Beta', weight: 0.35 },
        { id: 'gamma', name: 'Village Gamma', weight: 0.20 }
    ];

    const types = [
        { type: 'consultation', avg: 150, count: 4000 },
        { type: 'medicine_sale', avg: 300, count: 6000 }
    ];

    let totalRevenueSeeded = 0;
    let totalMarginSeeded = 0;
    let totalSeeded = 0;

    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 30);

    for (const typeInfo of types) {
        for (let j = 0; j < typeInfo.count; j++) {
            const rand = Math.random();
            let selectedNode = nodes[0];
            if (rand > 0.45 && rand <= 0.80) selectedNode = nodes[1];
            else if (rand > 0.80) selectedNode = nodes[2];

            // Item pricing
            let amount = 0;
            if (typeInfo.type === 'consultation') {
                amount = 150 * (0.9 + Math.random() * 0.2); // ~135 to 165
            } else {
                amount = 100 + Math.random() * 400; // 100 to 500
            }

            // To hit ₹20L margin from ₹29.5L revenue, we need ~67% margin
            let margin = amount * 0.6768; // Controlled margin
            let cost = amount - margin;

            // date within the last 30 days
            const entryDate = new Date();
            entryDate.setMinutes(entryDate.getMinutes() - (j * 2)); // Spread back from now

            // Precision adjustment on the very last few records
            if (totalSeeded === 9998) {
                // Final adjustment to hit exact targets
                amount = targetRevenue - totalRevenueSeeded - 100;
                margin = targetMargin - totalMarginSeeded - 50;
            } else if (totalSeeded === 9999) {
                amount = targetRevenue - totalRevenueSeeded;
                margin = targetMargin - totalMarginSeeded;
            }

            cost = amount - margin;

            await db.query(`
                INSERT INTO financial_transactions (id, transaction_type, node_id, amount, cost, margin, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [uuidv4(), typeInfo.type, selectedNode.id, amount, cost, margin, entryDate.toISOString()]);

            totalRevenueSeeded += amount;
            totalMarginSeeded += margin;
            totalSeeded++;

            if (totalSeeded >= 10000) break;
        }
        if (totalSeeded >= 10000) break;
    }

    console.log(`[SEED-SUCCESS] Generated ${totalSeeded} financial records.`);
    console.log(`- Final Revenue: ₹${totalRevenueSeeded.toLocaleString()}`);
    console.log(`- Final Margin: ₹${totalMarginSeeded.toLocaleString()}`);
}

if (require.main === module) {
    seed();
}

module.exports = seed;
