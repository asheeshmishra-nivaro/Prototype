const db = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Enterprise Role Governance Controller
 * Production-grade RBAC, Compliance, and Auditing.
 */

const getPermissions = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM permissions ORDER BY group_name");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
};

// 1. Enterprise Directory & User Management
const getUserManagement = async (req, res) => {
    try {
        const { search, role, node } = req.query;
        let query = `
            SELECT id, name, email, role, kyc_verified, license_number, license_expiry, 
                   account_status, last_login, two_fa_enabled, failed_attempts, 
                   assigned_nodes, created_at
            FROM users
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (name LIKE $${params.length + 1} OR email LIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }
        if (role) {
            query += ` AND role = $${params.length + 1}`;
            params.push(role);
        }
        // Node filtering (Assigned Nodes is JSON array in DB)
        if (node) {
            query += ` AND assigned_nodes LIKE $${params.length + 1}`;
            params.push(`%${node}%`);
        }

        query += " ORDER BY created_at DESC";
        const result = await db.query(query, params);

        // Map compliance status dynamically
        const users = result.rows.map(u => ({
            ...u,
            assigned_nodes: JSON.parse(u.assigned_nodes || '[]'),
            compliance_status: getComplianceStatus(u)
        }));

        res.json(users);
    } catch (err) {
        console.error('[RBAC-ERROR] getUserManagement:', err);
        res.status(500).json({ error: 'Failed to fetch enterprise directory' });
    }
};

const getComplianceStatus = (user) => {
    if (user.role === 'doctor') {
        if (!user.kyc_verified) return 'Red';
        if (!user.license_expiry) return 'Red';

        const expiry = new Date(user.license_expiry);
        const now = new Date();
        const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return 'Red';
        if (diffDays <= 30) return 'Yellow';
    }
    return user.kyc_verified ? 'Green' : 'Red';
};

const createUser = async (req, res) => {
    const { name, email, role, assigned_nodes, license_number, license_expiry, kyc_verified, two_fa_enabled } = req.body;

    if (!name || !email || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const id = uuidv4();
        await db.query(`
            INSERT INTO users (
                id, name, email, role, assigned_nodes, license_number, license_expiry, 
                kyc_verified, two_fa_enabled, password_hash
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'default_secure_pw')
        `, [
            id, name, email, role, JSON.stringify(assigned_nodes || []),
            license_number || null, license_expiry || null,
            kyc_verified ? 1 : 0, two_fa_enabled ? 1 : 0
        ]);

        await logActivity(req.user.id, 'User Created', 'System', null, `Created user: ${email}`);
        res.status(201).json({ id, message: 'User created successfully' });
    } catch (err) {
        console.error('[RBAC-ERROR] createUser:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

const bulkSuspendUsers = async (req, res) => {
    const { userIds, status } = req.body;
    try {
        const placeholders = userIds.map((_, i) => `$${i + 2}`).join(',');
        await db.query(`UPDATE users SET account_status = $1 WHERE id IN (${placeholders})`, [status, ...userIds]);

        await logActivity(req.user.id, `Bulk ${status}`, 'System', null, `Updated status for ${userIds.length} users`);
        res.json({ message: `Successfully updated ${userIds.length} users` });
    } catch (err) {
        res.status(500).json({ error: 'Bulk update failed' });
    }
};

// 2. Role Inheritance & Templates
const getRolesHierarchy = async (req, res) => {
    try {
        const roles = await db.query("SELECT * FROM roles ORDER BY parent_role_id ASC");
        const rolePerms = await db.query(`
            SELECT rp.role_id, p.key, p.group_name
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_key = p.key
        `);

        const formatted = roles.rows.map(role => ({
            ...role,
            direct_permissions_count: rolePerms.rows.filter(p => p.role_id === role.id).length,
            // Recursive count would be better done on frontend or with a CTE, 
            // but let's provide direct for now.
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

const getRuleTemplates = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM rule_templates");
        res.json(result.rows.map(t => ({ ...t, permissions: JSON.parse(t.permissions) })));
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
};

const applyTemplate = async (req, res) => {
    const { roleId, templateId } = req.body;
    try {
        const template = await db.query("SELECT permissions FROM rule_templates WHERE id = $1", [templateId]);
        if (template.rows.length === 0) return res.status(404).json({ error: 'Template not found' });

        const pKeys = JSON.parse(template.rows[0].permissions);
        await db.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);

        for (const pk of pKeys) {
            await db.query("INSERT INTO role_permissions (role_id, permission_key) VALUES ($1, $2)", [roleId, pk]);
        }

        await logActivity(req.user.id, 'Template Applied', 'Governance', null, `Applied template ${templateId} to role ${roleId}`);
        res.json({ message: 'Template applied successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to apply template' });
    }
};

// 3. Activity & Security Logs
const getDetailedActivityLogs = async (req, res) => {
    const { user, node, module, action, date } = req.query;
    try {
        let query = `
            SELECT al.*, u.name as user_name 
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (user) {
            query += ` AND u.name LIKE $${params.length + 1}`;
            params.push(`%${user}%`);
        }
        if (node) {
            query += ` AND al.node_id = $${params.length + 1}`;
            params.push(node);
        }
        if (module) {
            query += ` AND al.module = $${params.length + 1}`;
            params.push(module);
        }
        if (date) {
            query += ` AND DATE(al.timestamp) = $${params.length + 1}`;
            params.push(date);
        }

        query += " ORDER BY al.timestamp DESC LIMIT 100";
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

// Internal Logger Utility
const logActivity = async (userId, action, module, nodeId, details) => {
    try {
        await db.query(`
            INSERT INTO activity_logs (id, user_id, action, module, node_id, timestamp)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [uuidv4(), userId, action, module, nodeId]);
    } catch (e) {
        console.error('Logging failed:', e);
    }
};

// 4. Analytics & CSV
const getRoleDistribution = async (req, res) => {
    try {
        const roleDist = await db.query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
        const nodeDist = await db.query("SELECT id, name FROM villages");

        // Count users per node (since nodes are JSON arrays in users table)
        const users = await db.query("SELECT assigned_nodes FROM users");
        const nodeCounts = {};
        users.rows.forEach(u => {
            const nodes = JSON.parse(u.assigned_nodes || '[]');
            nodes.forEach(nId => {
                nodeCounts[nId] = (nodeCounts[nId] || 0) + 1;
            });
        });

        const nodeStats = nodeDist.rows.map(v => ({
            name: v.name,
            user_count: nodeCounts[v.id] || 0
        }));

        res.json({ roleDist: roleDist.rows, nodeDist: nodeStats });
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
};

const exportUserCSV = async (req, res) => {
    try {
        const result = await db.query("SELECT name, email, role, account_status, kyc_verified FROM users");
        let csv = "Name,Email,Role,Status,KYC\n";
        result.rows.forEach(u => {
            csv += `${u.name},${u.email},${u.role},${u.account_status},${u.kyc_verified ? 'YES' : 'NO'}\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        res.status(200).send(csv);
    } catch (err) {
        res.status(500).send('Export failed');
    }
};

module.exports = {
    getUserManagement,
    createUser,
    bulkSuspendUsers,
    getRolesHierarchy,
    getPermissions,
    getRuleTemplates,
    applyTemplate,
    getDetailedActivityLogs,
    getRoleDistribution,
    exportUserCSV
};
