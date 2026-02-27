const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

let db;
let pgPool;

if (isProduction && process.env.DATABASE_URL) {
    console.log('[DB-INFO] Using PostgreSQL Connection');
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    console.log('[DB-INFO] Using SQLite Connection');
    const dbPath = path.resolve(__dirname, '../nivaro.db');
    const dbExists = fs.existsSync(dbPath);

    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('[DB-ERROR] SQLite Connection Failed:', err.message);
        } else {
            console.log('[DB-SUCCESS] SQLite Connected at', new Date().toISOString());
            if (!dbExists) {
                console.log('[DB-INFO] New database created. Initializing schema...');
                initializeSchema();
            }
        }
    });
}

function initializeSchema() {
    const schemaPath = path.resolve(__dirname, '../db/schema_sqlite.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
        if (err) {
            console.error('[DB-ERROR] Schema initialization failed:', err.message);
        } else {
            console.log('[DB-SUCCESS] Schema initialized successfully.');
        }
    });
}

/**
 * Query Bridge
 * Handles both SQLite and PostgreSQL connections.
 */
const queryBridge = async (text, params = []) => {
    if (pgPool) {
        // PostgreSQL path
        try {
            const start = Date.now();
            const res = await pgPool.query(text, params);
            const duration = Date.now() - start;
            // console.log('[DB-QUERY]', { text, duration, rows: res.rowCount });
            return res;
        } catch (err) {
            console.error('[DB-QUERY-ERROR] PostgreSQL:', err.message, '| SQL:', text);
            throw err;
        }
    } else {
        // SQLite path
        return new Promise((resolve, reject) => {
            // Match all $n placeholders and convert to ?
            const matches = text.match(/\$(\d+)/g) || [];
            let sql = text;
            const mappedParams = [];

            if (matches.length > 0) {
                const placeholders = text.match(/\$\d+/g);
                if (placeholders) {
                    placeholders.forEach(p => {
                        const idx = parseInt(p.substring(1)) - 1;
                        mappedParams.push(params[idx]);
                    });
                    sql = text.replace(/\$\d+/g, '?');
                }
            } else {
                mappedParams.push(...params);
            }

            // Translate PostgreSQL ILIKE to SQLite LIKE
            sql = sql.replace(/ILIKE/gi, 'LIKE');

            const normalizedSql = sql.trim().toUpperCase();
            const isRead = normalizedSql.startsWith('SELECT') || normalizedSql.startsWith('PRAGMA');

            if (isRead) {
                db.all(sql, mappedParams, (err, rows) => {
                    if (err) {
                        console.error('[DB-QUERY-ERROR] SQLite:', err.message, '| SQL:', sql);
                        reject(err);
                    } else {
                        resolve({ rows });
                    }
                });
            } else {
                db.run(sql, mappedParams, function (err) {
                    if (err) {
                        console.error('[DB-QUERY-ERROR] SQLite:', err.message, '| SQL:', sql);
                        reject(err);
                    } else {
                        resolve({ rows: [], lastID: this.lastID, changes: this.changes });
                    }
                });
            }
        });
    }
};

module.exports = {
    query: queryBridge,
    pool: {
        query: queryBridge,
        end: () => pgPool ? pgPool.end() : db.close()
    }
};
