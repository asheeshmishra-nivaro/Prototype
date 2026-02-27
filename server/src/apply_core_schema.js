const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

async function apply() {
    const dbPath = path.resolve(__dirname, '../nivaro.db');
    const sqlPath = path.resolve(__dirname, '../db/schema_sqlite.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const db = new sqlite3.Database(dbPath);

    console.log('[SCHEMA] Applying core schema from schema_sqlite.sql...');

    // Split SQL by semicolon to execute one by one to avoid some SQLite driver limitations
    // (though db.exec should handle multiple statements)
    db.exec(sql, (err) => {
        if (err) {
            console.error('[SCHEMA-ERROR]', err.message);
            // Don't exit if it's just "table already exists"
            if (!err.message.includes('already exists')) {
                process.exit(1);
            }
        }
        console.log('[SCHEMA-SUCCESS] Core schema applied/verified.');
        db.close();
    });
}

apply();
