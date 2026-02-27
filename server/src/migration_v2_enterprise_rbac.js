const db = require('./db');

/**
 * Enterprise RBAC Migration V2
 * Upgrades schema to production-grade healthcare standards.
 */
const migrateEnterpriseRBAC = async () => {
    console.log('[MIGRATION] Starting Enterprise RBAC V2 Migration...');

    try {
        // 1. Roles Table Enhancement
        // SQLite doesn't support multiple ADD COLUMNs, doing it sequentially
        const roleCols = [
            'description TEXT',
            'system_role BOOLEAN DEFAULT 0'
        ];
        for (const col of roleCols) {
            try {
                await db.query(`ALTER TABLE roles ADD COLUMN ${col}`);
            } catch (e) {
                if (!e.message.includes('duplicate column name')) console.error(e.message);
            }
        }

        // 2. Users Table Enhancement
        const userCols = [
            'license_number TEXT',
            'license_expiry DATE',
            'assigned_nodes TEXT', // JSON array of node IDs
            'kyc_verified BOOLEAN DEFAULT 0',
            'two_fa_enabled BOOLEAN DEFAULT 0',
            'account_status TEXT DEFAULT "Active"',
            'last_ip TEXT',
            'failed_attempts INTEGER DEFAULT 0',
            'locked_until DATETIME'
        ];
        for (const col of userCols) {
            try {
                await db.query(`ALTER TABLE users ADD COLUMN ${col}`);
            } catch (e) {
                if (!e.message.includes('duplicate column name')) console.error(e.message);
            }
        }

        // 3. New Table: rule_templates
        await db.query(`
            CREATE TABLE IF NOT EXISTS rule_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                permissions TEXT NOT NULL, -- JSON array of permission keys
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. New Table: activity_logs (The requested enterprise version)
        await db.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                action TEXT NOT NULL,
                module TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                node_id TEXT
            )
        `);

        console.log('[DB-SUCCESS] Enterprise RBAC V2 Schema Applied.');
    } catch (err) {
        console.error('[DB-ERROR] Migration failed:', err);
        process.exit(1);
    }
};

if (require.main === module) {
    migrateEnterpriseRBAC().then(() => process.exit(0));
}

module.exports = migrateEnterpriseRBAC;
