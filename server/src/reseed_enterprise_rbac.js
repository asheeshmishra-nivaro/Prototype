const db = require('./db');
const { v4: uuidv4 } = require('uuid');

const reseedEnterpriseRBAC = async () => {
    console.log('[SEED] Starting Enterprise RBAC High-Fidelity Seeding...');

    try {
        // 1. Clear existing RBAC-related data to avoid conflicts
        await db.query("DELETE FROM activity_logs");
        await db.query("DELETE FROM rule_templates");
        await db.query("DELETE FROM user_node_access");
        await db.query("DELETE FROM role_permissions");
        await db.query("DELETE FROM roles");
        await db.query("DELETE FROM permissions");
        // We keep existing users but we'll deactivate/update them or add new ones.
        // Actually, user wants "NOT prototype", so I will clean up the users table for a fresh start or add 12 specific ones.
        // Let's add 12 specific users.
        await db.query("DELETE FROM users");

        // 2. Fetch Villages for Node Assignment
        const villageRes = await db.query("SELECT id FROM villages");
        const villages = villageRes.rows.map(v => v.id);
        const nodeA = villages[0] || 'v1';
        const nodeB = villages[1] || 'v2';
        const nodeC = villages[2] || 'v3';

        // 3. Seed Permissions
        const perms = [
            ['clinical.view', 'Clinical', 'View patient files'],
            ['clinical.prescribe', 'Clinical', 'Write prescriptions'],
            ['clinical.vitals', 'Clinical', 'Update patient vitals'],
            ['clinical.emergency', 'Emergency', 'Trigger emergency alerts'],
            ['ops.inventory', 'Operational', 'Manage node inventory'],
            ['ops.nodes', 'Operational', 'View node performance'],
            ['ops.dispense', 'Operational', 'Dispense medicines'],
            ['ops.register', 'Operational', 'Register patients'],
            ['fin.billing', 'Financial', 'Manage patient billing'],
            ['fin.reports', 'Financial', 'Export revenue logs'],
            ['sys.users', 'System', 'Manage user accounts'],
            ['sys.roles', 'System', 'Edit role hierarchies'],
            ['sys.debug', 'System', 'Access debug terminals'],
            ['sys.audit', 'System', 'View security logs']
        ];

        for (const [key, group, desc] of perms) {
            await db.query("INSERT INTO permissions (key, group_name, description) VALUES ($1, $2, $3)", [key, group, desc]);
        }

        // 4. Seed Hierarchical Roles
        const roleHierarchy = [
            ['super_admin', 'Super Admin', null, 'Full system ownership and governance', 1],
            ['admin', 'Admin', 'super_admin', 'Regional administration and user management', 1],
            ['clin_admin', 'Clinical Admin', 'admin', 'Clinical oversight and doctor management', 1],
            ['doctor', 'Doctor', 'clin_admin', 'Clinical consultation and prescribing', 1],
            ['operator', 'Operator', 'clin_admin', 'Front-line node operations and dispensing', 1],
            ['read_only', 'Read Only Viewer', 'operator', 'Limited audit and observation access', 1]
        ];

        for (const [id, name, parent, desc, sys] of roleHierarchy) {
            await db.query("INSERT INTO roles (id, name, parent_role_id, description, system_role) VALUES ($1, $2, $3, $4, $5)", [id, name, parent, desc, sys]);
        }

        // Map base permissions
        const rolePerms = [
            ['super_admin', ['sys.users', 'sys.roles', 'sys.debug', 'sys.audit']],
            ['admin', ['sys.users', 'ops.nodes', 'fin.reports', 'sys.audit']],
            ['clin_admin', ['clinical.view', 'ops.nodes', 'clinical.emergency']],
            ['doctor', ['clinical.view', 'clinical.prescribe', 'clinical.vitals']],
            ['operator', ['ops.inventory', 'ops.dispense', 'ops.register', 'clinical.vitals']],
            ['read_only', ['clinical.view', 'ops.nodes']]
        ];

        for (const [rid, pkeys] of rolePerms) {
            for (const pk of pkeys) {
                await db.query("INSERT INTO role_permissions (role_id, permission_key) VALUES ($1, $2)", [rid, pk]);
            }
        }

        // 5. Seed Rule Templates
        const templates = [
            {
                id: 'tmpl_rural_doctor',
                name: 'Rural Node Doctor',
                description: 'Optimized for doctors in remote clinical sites.',
                permissions: JSON.stringify(['clinical.view', 'clinical.prescribe', 'clinical.vitals'])
            },
            {
                id: 'tmpl_inv_operator',
                name: 'Inventory Operator',
                description: 'Standard access for pharmacy and inventory staff.',
                permissions: JSON.stringify(['ops.register', 'clinical.vitals', 'ops.dispense', 'ops.inventory'])
            },
            {
                id: 'tmpl_reg_admin',
                name: 'Regional Admin',
                description: 'Regional monitoring and staff oversight.',
                permissions: JSON.stringify(['ops.nodes', 'fin.reports', 'sys.audit', 'sys.users'])
            }
        ];

        for (const t of templates) {
            await db.query("INSERT INTO rule_templates (id, name, description, permissions) VALUES ($1, $2, $3, $4)", [t.id, t.name, t.description, t.permissions]);
        }

        // 6. Seed 12+ Enterprise Users
        const userBatch = [
            // Super Admins
            ['u01', 'Aniket Sharma', 'a.sharma@nivaro.com', 'super_admin', 'Active', 1, 1, 0, JSON.stringify(villages)],
            ['u02', 'Priya Iyer', 'p.iyer@nivaro.com', 'super_admin', 'Active', 1, 1, 0, JSON.stringify(villages)],
            // Admins
            ['u03', 'Vikram Seth', 'v.seth@nivaro.com', 'admin', 'Active', 1, 1, 0, JSON.stringify([nodeA, nodeB])],
            ['u04', 'Sanjay Gupta', 's.gupta@nivaro.com', 'admin', 'Active', 1, 0, 0, JSON.stringify([nodeC])], // 2FA disabled
            // Clinical Admins
            ['u05', 'Dr. Aruna Roy', 'a.roy@nivaro.com', 'clin_admin', 'Active', 1, 1, 0, JSON.stringify([nodeA, nodeB, nodeC])],
            ['u06', 'Dr. Kabir Khan', 'k.khan@nivaro.com', 'clin_admin', 'Active', 1, 1, 0, JSON.stringify([nodeA])],
            // Doctors
            ['u07', 'Dr. Amartya Sen', 'doctor@nivaro.com', 'doctor', 'Active', 1, 1, 0, JSON.stringify([nodeA]), 'MC-2026-9921', '2027-12-31'],
            ['u08', 'Dr. Meera Bai', 'm.bai@nivaro.com', 'doctor', 'Active', 1, 1, 0, JSON.stringify([nodeB]), 'MC-2026-8812', '2026-03-15'], // Expiring soon
            ['u09', 'Dr. Elena Rossi', 'e.rossi@nivaro.health', 'doctor', 'Active', 0, 1, 0, JSON.stringify([nodeC]), 'MC-PRO-9923', '2026-02-10'], // Expired
            // Operators
            ['u10', 'Rahul Bose', 'r.bose@nivaro.com', 'operator', 'Active', 1, 1, 0, JSON.stringify([nodeA, nodeB])], // Multi-node
            ['u11', 'Sunita Rao', 's.rao@nivaro.com', 'operator', 'Active', 1, 1, 0, JSON.stringify([nodeB])],
            ['u12', 'Sarah Kim', 'sarah.k@nivaro.com', 'operator', 'Suspended', 1, 1, 0, JSON.stringify([nodeC])] // Suspended
        ];

        for (const u of userBatch) {
            await db.query(`
                INSERT INTO users (
                    id, name, email, role, account_status, kyc_verified, two_fa_enabled, 
                    failed_attempts, assigned_nodes, license_number, license_expiry, password_hash
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'hashed_demo_pw')
            `, [u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8], u[9] || null, u[10] || null]);
        }

        // 7. Seed 50 Realistic Activity Logs
        const modules = ['Auth', 'Clinical', 'Inventory', 'System', 'Billing'];
        const actions = ['User Login', 'Prescription Issued', 'Stock Update', 'Role Modified', 'Failed Login', 'Profile Edit', 'Node Assigned'];

        for (let i = 0; i < 55; i++) {
            const randomUser = userBatch[Math.floor(Math.random() * userBatch.length)];
            const randomModule = modules[i % modules.length];
            const randomAction = actions[i % actions.length];
            const randomNode = villages[Math.floor(Math.random() * villages.length)] || 'global';

            await db.query(`
                INSERT INTO activity_logs (id, user_id, action, module, ip_address, node_id, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6, date('now', '-${i} hours'))
            `, [uuidv4(), randomUser[0], randomAction, randomModule, `192.168.1.${10 + i}`, randomNode]);
        }

        console.log('[SEED-SUCCESS] Enterprise RBAC Data Population Complete.');
    } catch (err) {
        console.error('[SEED-ERROR]', err);
    }
};

if (require.main === module) {
    reseedEnterpriseRBAC().then(() => process.exit(0));
}

module.exports = reseedEnterpriseRBAC;
