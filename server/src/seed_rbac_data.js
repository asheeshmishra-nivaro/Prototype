const db = require('./db');
const { v4: uuidv4 } = require('uuid');

const seedRBACData = async () => {
    console.log('[SEED] Starting Enterprise RBAC Data Population...');

    try {
        // 1. Get existing data
        const villageRes = await db.query("SELECT id FROM villages");
        const villages = villageRes.rows.map(v => v.id);

        const adminRes = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        const adminId = adminRes.rows[0]?.id;

        if (adminId) {
            // Upgrade default admin to Super Admin hierarchy
            await db.query("UPDATE users SET role = 'super_admin' WHERE id = $1", [adminId]);
            // Give super admin access to all currently known nodes
            for (const vid of villages) {
                await db.query("INSERT OR REPLACE INTO user_node_access (user_id, node_id, access_type) VALUES ($1, $2, 'full')", [adminId, vid]);
            }
        }

        // 2. Add New Realistic Corporate Data
        const corpus = [
            { name: 'Dr. Sarah Mitchell', email: 's.mitchell@nivaro.health', role: 'doctor', license: 'MC-PRO-7721', expiry: "date('now', '+15 days')", kyc: 1 },
            { name: 'Dr. James Wilson', email: 'j.wilson@nivaro.health', role: 'doctor', license: 'MC-PRO-8812', expiry: "date('now', '+365 days')", kyc: 1 },
            { name: 'Dr. Elena Rossi', email: 'e.rossi@nivaro.health', role: 'doctor', license: 'MC-PRO-9923', expiry: "date('now', '-5 days')", kyc: 0 },
            { name: 'Regional Ops Manager', email: 'ops.pune@nivaro.health', role: 'clin_admin', nodes: villages.slice(0, 2) },
            { name: 'Village Operator 1', email: 'vo1@nivaro.health', role: 'operator', nodes: [villages[0] || 'v1'] },
            { name: 'Audit Supervisor', email: 'auditor@nivaro.health', role: 'read_only', nodes: villages }
        ];

        for (const emp of corpus) {
            const userId = uuidv4();
            await db.query(`
                INSERT INTO users (id, name, email, password_hash, role, kyc_verified, license_number, license_expiry, digital_signature_enabled)
                VALUES ($1, $2, $3, $4, $5, $6, $7, ${emp.expiry || 'NULL'}, $8)
            `, [
                userId, emp.name, emp.email, 'hashed_demo_pw', emp.role, emp.kyc || 0, emp.license || null, emp.role === 'doctor' ? 1 : 0
            ]);

            if (emp.nodes) {
                for (const vid of emp.nodes) {
                    await db.query("INSERT INTO user_node_access (user_id, node_id, access_type) VALUES ($1, $2, 'full')", [userId, vid]);
                }
            }
        }

        // 3. Add Security Activity Logs
        const logs = [
            { user: adminId, action: 'User Suspended: u4', ip: '192.168.1.45' },
            { user: adminId, action: 'Global Pricing Modified: Inventory', ip: '192.168.1.45' },
            { user: 'SYSTEM', action: 'Failed Login Attempt: root', ip: '45.72.112.5' },
            { user: 'SYSTEM', action: 'Failed Login Attempt: admin@nivaro.com', ip: '45.72.112.5' },
            { user: adminId, action: 'Role Inheritance Tree Regenerated', ip: '192.168.1.45' }
        ];

        for (const log of logs) {
            await db.query(`
                INSERT INTO activity_log (id, user_id, action, ip_address, timestamp)
                VALUES ($1, $2, $3, $4, date('now', '-${Math.floor(Math.random() * 5)} hours'))
            `, [uuidv4(), log.user, log.action, log.ip]);
        }

        console.log('[SEED-SUCCESS] Enterprise RBAC Data Live.');

    } catch (err) {
        console.error('[SEED-ERROR]', err);
    }
};

if (require.main === module) {
    seedRBACData().then(() => process.exit(0));
}

module.exports = seedRBACData;
