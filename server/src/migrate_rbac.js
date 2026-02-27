const db = require('./db');

const migrateRBAC = async () => {
    console.log('[MIGRATION] Starting Enterprise RBAC Migration...');

    try {
        // 1. Roles Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_role_id TEXT REFERENCES roles(id),
                is_template BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Permissions Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS permissions (
                key TEXT PRIMARY KEY,
                group_name TEXT NOT NULL, -- Clinical, Operational, Financial, System, Emergency
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Role-Permissions Mapping
        await db.query(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id TEXT REFERENCES roles(id),
                permission_key TEXT REFERENCES permissions(key),
                PRIMARY KEY (role_id, permission_key)
            )
        `);

        // 4. User Node Access (Multi-node)
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_node_access (
                user_id TEXT REFERENCES users(id),
                node_id TEXT REFERENCES villages(id),
                access_type TEXT NOT NULL, -- full, clinical, inventory, read_only
                PRIMARY KEY (user_id, node_id)
            )
        `);

        // 5. Activity Log (Enhanced for security)
        await db.query(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                action TEXT NOT NULL,
                node_id TEXT REFERENCES villages(id),
                ip_address TEXT,
                user_agent TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 6. Alter Users Table (Compliance & Security)
        // SQLite doesn't support multiple ADD COLUMNs in one statement
        const columns = [
            'kyc_verified BOOLEAN DEFAULT 0',
            'license_expiry DATE',
            'digital_signature_enabled BOOLEAN DEFAULT 0',
            'consultation_limit_per_day INTEGER DEFAULT 20',
            'two_fa_enabled BOOLEAN DEFAULT 0',
            'failed_login_attempts INTEGER DEFAULT 0',
            'account_locked BOOLEAN DEFAULT 0',
            'last_login_ip TEXT',
            'security_role_id TEXT REFERENCES roles(id)'
        ];

        for (const col of columns) {
            try {
                await db.query(`ALTER TABLE users ADD COLUMN ${col}`);
            } catch (e) {
                if (e.message.includes('duplicate column name')) {
                    console.log(`[DB-INFO] Column ${col.split(' ')[0]} already exists.`);
                } else {
                    console.error(`[DB-ERROR] Failed to add column ${col}:`, e.message);
                }
            }
        }

        console.log('[DB-SUCCESS] Enterprise RBAC Schema Applied.');

        // 7. Seed Initial Roles & Permissions
        await seedInitialRBAC();

    } catch (err) {
        console.error('[DB-ERROR] Migration failed:', err);
    }
};

const seedInitialRBAC = async () => {
    console.log('[SEED] Initializing RBAC Blueprints...');

    // permissions: [key, group, description]
    const basePermissions = [
        ['clinical.view', 'Clinical', 'View patient files'],
        ['clinical.prescribe', 'Clinical', 'Write prescriptions'],
        ['clinical.emergency', 'Emergency', 'Trigger emergency alerts'],
        ['ops.inventory', 'Operational', 'Manage stock movements'],
        ['ops.nodes', 'Operational', 'View node performance'],
        ['fin.billing', 'Financial', 'Manage patient billing'],
        ['fin.reports', 'Financial', 'Export revenue logs'],
        ['sys.users', 'System', 'Manage user accounts'],
        ['sys.roles', 'System', 'Edit role hierarchies'],
        ['sys.debug', 'System', 'Access debug terminals']
    ];

    for (const [key, group, desc] of basePermissions) {
        await db.query("INSERT OR REPLACE INTO permissions (key, group_name, description) VALUES ($1, $2, $3)", [key, group, desc]);
    }

    // roles: [id, name, parent]
    const roles = [
        ['super_admin', 'Super Admin', null],
        ['admin', 'Admin', 'super_admin'],
        ['clin_admin', 'Clinical Admin', 'admin'],
        ['doctor', 'Doctor', 'clin_admin'],
        ['operator', 'Operator', 'clin_admin'],
        ['read_only', 'Read-Only Viewer', 'operator']
    ];

    for (const [id, name, parent] of roles) {
        await db.query("INSERT OR REPLACE INTO roles (id, name, parent_role_id, is_template) VALUES ($1, $2, $3, 1)", [id, name, parent]);
    }

    // Sample mapping (Successive inheritance will be handled in code, but let's map base)
    const mappings = [
        ['super_admin', 'sys.roles'],
        ['admin', 'sys.users'],
        ['clin_admin', 'clinical.view'],
        ['doctor', 'clinical.prescribe'],
        ['operator', 'ops.inventory'],
        ['read_only', 'clinical.view']
    ];

    for (const [rid, pid] of mappings) {
        await db.query("INSERT OR REPLACE INTO role_permissions (role_id, permission_key) VALUES ($1, $2)", [rid, pid]);
    }

    console.log('[SEED-SUCCESS] RBAC Hierarchy Pre-loaded.');
};

if (require.main === module) {
    migrateRBAC().then(() => process.exit(0));
}

module.exports = migrateRBAC;
