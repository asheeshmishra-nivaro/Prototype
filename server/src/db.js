const { db: firestore, auth } = require('./lib/firebase');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;
const useFirebase = process.env.USE_FIREBASE === 'true';

let sqlDb;
let pgPool;

// Initialize Legacy SQL if needed
if (!useFirebase) {
    if (isProduction && process.env.DATABASE_URL) {
        pgPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
    } else {
        const dbPath = path.resolve(__dirname, '../nivaro.db');
        sqlDb = new sqlite3.Database(dbPath);
    }
}

/**
 * Firestore Migration Wrapper
 * This bridge allows existing SQL queries to be gradually ported to Firestore.
 */
const queryBridge = async (text, params = []) => {
    if (useFirebase && firestore) {
        // TODO: Map complex SQL to Firestore collections
        // For now, most queries will need to be refactored at the controller level
        console.warn(`[FIREBASE-BRIDGE] SQL query attempted on Firestore: ${text.substring(0, 50)}...`);
        return { rows: [] };
    }

    if (pgPool) {
        const res = await pgPool.query(text, params);
        return res;
    } else {
        return new Promise((resolve, reject) => {
            const sql = text.replace(/\$\d+/g, '?');
            const normalizedSql = sql.trim().toUpperCase();
            if (normalizedSql.startsWith('SELECT')) {
                sqlDb.all(sql, params, (err, rows) => {
                    if (err) reject(err); else resolve({ rows });
                });
            } else {
                sqlDb.run(sql, params, function (err) {
                    if (err) reject(err); else resolve({ rows: [], lastID: this.lastID });
                });
            }
        });
    }
};

module.exports = {
    query: queryBridge,
    firestore,
    auth,
    pool: {
        query: queryBridge,
        end: () => pgPool ? pgPool.end() : (sqlDb ? sqlDb.close() : null)
    }
};
