const fs = require('fs');
const path = require('path');
const db = require('./db');

async function applyIndexes() {
    console.log('[INDEXER] Starting Database Optimization...');

    try {
        const sqlPath = path.join(__dirname, '../db/performance_indexes.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('[INDEXER] Executing SQL script...');
        const sqlite3 = require('sqlite3').verbose();
        const dbRaw = new sqlite3.Database(path.resolve(__dirname, '../nivaro.db'));

        await new Promise((resolve, reject) => {
            dbRaw.exec(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        dbRaw.close();

        console.log('[SUCCESS] Database indexes applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('[ERROR] Failed to apply indexes:');
        console.error(err.message);
        process.exit(1);
    }
}

applyIndexes();
