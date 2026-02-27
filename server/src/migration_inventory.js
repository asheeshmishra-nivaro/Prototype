const db = require('./db');

/**
 * Enterprise Inventory Migration V1
 * Upgrades schema to production-grade pharmaceutical standards.
 */
const migrateEnterpriseInventory = async () => {
    console.log('[MIGRATION] Starting Enterprise Inventory Migration...');

    try {
        // 1. Medicines Table Enhancement (SKU Master)
        // SQLite doesn't support multiple ADD COLUMNs, doing it sequentially
        const medicineCols = [
            'mrp REAL',
            'margin_percent REAL',
            'category TEXT',
            'manufacturer TEXT'
        ];
        for (const col of medicineCols) {
            try {
                await db.query(`ALTER TABLE medicines ADD COLUMN ${col}`);
            } catch (e) {
                if (!e.message.includes('duplicate column name')) console.error(e.message);
            }
        }

        // 2. New Table: inventory_reconciliations
        await db.query(`
            CREATE TABLE IF NOT EXISTS inventory_reconciliations (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                village_id TEXT REFERENCES villages(id),
                sku_id TEXT NOT NULL,
                physical_qty INTEGER NOT NULL,
                logical_qty INTEGER NOT NULL,
                variance INTEGER NOT NULL,
                status TEXT DEFAULT 'Resolved', -- Pending, Resolved
                notes TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Ensure Batch Inventory has selling_price and village_id support
        // (village_id is already in schema_sqlite.sql, but we ensure selling_price for financial audit)
        try {
            await db.query(`ALTER TABLE inventory_batches ADD COLUMN selling_price REAL`);
        } catch (e) {
            if (!e.message.includes('duplicate column name')) console.error(e.message);
        }

        console.log('[DB-SUCCESS] Enterprise Inventory Schema Applied.');
    } catch (err) {
        console.error('[DB-ERROR] Migration failed:', err);
        process.exit(1);
    }
};

if (require.main === module) {
    migrateEnterpriseInventory().then(() => process.exit(0));
}

module.exports = migrateEnterpriseInventory;
