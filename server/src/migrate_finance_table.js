const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function migrate() {
    const dbPath = path.resolve(__dirname, '../nivaro.db');
    const db = new sqlite3.Database(dbPath);

    console.log('[MIGRATE] Creating financial_transactions table...');

    const sql = `
    CREATE TABLE IF NOT EXISTS financial_transactions (
        id TEXT PRIMARY KEY,
        transaction_type TEXT NOT NULL,
        node_id TEXT NOT NULL,
        amount REAL DEFAULT 0,
        cost REAL DEFAULT 0,
        margin REAL DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_finance_timestamp ON financial_transactions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_finance_type ON financial_transactions(transaction_type);
    `;

    db.exec(sql, (err) => {
        if (err) {
            console.error('[MIGRATE-ERROR]', err.message);
            process.exit(1);
        }
        console.log('[MIGRATE] Table created successfully.');
        db.close();
    });
}

migrate();
