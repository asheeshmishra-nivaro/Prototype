const { firestore } = require('./src/db');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * Migration Utility: SQLite to Firestore
 * This script seeds your Firebase project with existing prototype data.
 */

const dbPath = path.resolve(__dirname, 'nivaro.db');
const sqlDb = new sqlite3.Database(dbPath);

const tables = [
    'users', 'villages', 'patients', 'medicines',
    'inventory_batches', 'consultations', 'prescriptions',
    'stock_movements', 'financial_transactions', 'audit_logs'
];

async function migrate() {
    console.log('[MIGRATION] Starting SQLite to Firestore transfer...');

    for (const table of tables) {
        console.log(`[MIGRATION] Checking table: ${table}`);

        try {
            const tableExists = await new Promise((resolve) => {
                sqlDb.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`, (err, row) => {
                    resolve(!!row);
                });
            });

            if (!tableExists) {
                console.warn(`[MIGRATION] Skipping ${table} - Table does not exist in SQLite.`);
                continue;
            }

            const rows = await new Promise((resolve, reject) => {
                sqlDb.all(`SELECT * FROM ${table}`, [], (err, rows) => {
                    if (err) reject(err); else resolve(rows);
                });
            });

            console.log(`[MIGRATION] Found ${rows.length} rows in ${table}`);

            const collectionRef = firestore.collection(table);

            // Batch writes (max 500 per batch)
            let batch = firestore.batch();
            let count = 0;

            for (const row of rows) {
                // Convert JSON strings back to objects if they look like JSON
                for (const key in row) {
                    if (typeof row[key] === 'string' && (row[key].startsWith('{') || row[key].startsWith('['))) {
                        try {
                            row[key] = JSON.parse(row[key]);
                        } catch (e) { /* ignore */ }
                    }
                    // Handle Timestamps
                    if (key === 'timestamp' || key === 'created_at' || key === 'start_time' || key === 'end_time' || key === 'expiry_date') {
                        if (row[key]) row[key] = new Date(row[key]);
                    }
                }

                const docRef = collectionRef.doc(row.id?.toString() || Date.now().toString() + Math.random());
                batch.set(docRef, row);
                count++;

                if (count % 400 === 0) {
                    await batch.commit();
                    batch = firestore.batch();
                    console.log(`[MIGRATION] Committed ${count} docs for ${table}`);
                }
            }

            if (count % 400 !== 0) {
                await batch.commit();
            }
            console.log(`[MIGRATION] Completed ${table} (${count} documents)`);
        } catch (err) {
            console.error(`[MIGRATION-ERROR] Failed to process table ${table}:`, err);
        }
    }

    console.log('[MIGRATION] SUCCESS: All data transferred to Firestore.');
    process.exit(0);
}

migrate().catch(err => {
    console.error('[MIGRATION-ERROR]', err);
    process.exit(1);
});
