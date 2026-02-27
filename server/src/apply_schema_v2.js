const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

async function apply() {
    const dbPath = path.resolve(__dirname, '../nivaro.db');
    const db = new sqlite3.Database(dbPath);

    console.log('[SCHEMA-V2] Applying new tables...');

    const sql = `
    CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
        id TEXT PRIMARY KEY,
        vendor_id TEXT REFERENCES vendors(id),
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_amount REAL,
        status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS inventory_batches (
        id TEXT PRIMARY KEY,
        medicine_id TEXT REFERENCES medicines(id),
        village_id TEXT REFERENCES villages(id),
        batch_number TEXT NOT NULL,
        purchase_order_id TEXT REFERENCES purchase_orders(id),
        expiry_date DATE NOT NULL,
        initial_quantity INT NOT NULL,
        remaining_quantity INT NOT NULL,
        purchase_cost REAL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        medicine_id TEXT REFERENCES medicines(id),
        batch_id TEXT REFERENCES inventory_batches(id),
        village_id TEXT REFERENCES villages(id),
        movement_type TEXT NOT NULL,
        quantity INT NOT NULL,
        linked_entity_id TEXT,
        user_id TEXT REFERENCES users(id),
        reason TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_batch_expiry ON inventory_batches(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_movement_medicine ON stock_movements(medicine_id);
    `;

    db.exec(sql, (err) => {
        if (err) {
            console.error('[SCHEMA-V2-ERROR]', err.message);
            process.exit(1);
        }
        console.log('[SCHEMA-V2] Tables created successfully.');
        db.close();
    });
}

apply();
