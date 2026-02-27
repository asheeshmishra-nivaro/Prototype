const db = require('./db');

async function migrate() {
    console.log('[MIGRATION] Creating financial_transactions table...');
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS financial_transactions (
                id TEXT PRIMARY KEY,
                transaction_type TEXT NOT NULL, -- consultation, medicine_sale, inventory_purchase
                node_id TEXT NOT NULL,
                amount REAL NOT NULL,
                cost REAL NOT NULL,
                margin REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                operator_id TEXT,
                reference_id TEXT
            )
        `);
        console.log('[MIGRATION-SUCCESS] financial_transactions table ready.');
    } catch (err) {
        console.error('[MIGRATION-ERROR]', err);
    }
}

if (require.main === module) {
    migrate();
}

module.exports = migrate;
