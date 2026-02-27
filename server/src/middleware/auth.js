const jwt = require('jsonwebtoken');
const db = require('../db');

/**
 * Enterprise Hierarchical RBAC Auth Middleware
 * @param {string[]} requiredRoles - Roles allowed to access the route
 */
const auth = (requiredRoles = []) => {
    return async (req, res, next) => {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.replace('Bearer ', '');

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nivaro_production_secret_2026');
            req.user = decoded;

            // 1. Check direct role match
            if (requiredRoles.length === 0 || requiredRoles.includes(decoded.role)) {
                return next();
            }

            // 2. Hierarchical Validation (Recursive parent check)
            // If the user's role is a parent (or ancestor) of any required role, allow it.
            const isAllowed = await checkHierarchy(decoded.role, requiredRoles);

            if (isAllowed) {
                return next();
            }

            return res.status(403).json({
                error: 'Forbidden',
                message: `Requires role: ${requiredRoles.join(', ')}. Your role (${decoded.role}) does not inherit required access.`
            });
        } catch (ex) {
            res.status(401).json({ error: 'Invalid or expired token.' });
        }
    };
};

/**
 * Checks if 'userRole' inherits 'requiredRoles' by traversing parents
 */
async function checkHierarchy(userRole, requiredRoles) {
    try {
        // We look for direct connections first
        // If Role A is parent of Role B, and Role B is required, then Role A is allowed.
        // The structure from migration: super_admin (null parent), admin (parent: super_admin)
        // Wait, the hierarchy in migration was: super_admin -> admin -> clin_admin.
        // This means admin's parent is super_admin.
        // If 'clin_admin' is required, we check if userRole (e.g. super_admin) is an ancestor.

        // Find path from requiredRoles back to roots
        for (const reqRole of requiredRoles) {
            let current = reqRole;
            while (current) {
                const res = await db.query("SELECT parent_role_id FROM roles WHERE id = $1", [current]);
                if (res.rows.length === 0) break;

                const parent = res.rows[0].parent_role_id;
                if (parent === userRole) return true;
                current = parent;
            }
        }
    } catch (err) {
        console.error('[RBAC-ERROR] Hierarchy check failed:', err);
    }
    return false;
}

module.exports = auth;
