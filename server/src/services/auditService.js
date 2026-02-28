const { firestore: db } = require('../db');

/**
 * Logs a system action with role context and entity changes (Firestore Edition).
 */
const logAction = async (userId, role, action, entity, entityId, prevValue = null, newValue = null) => {
    const logId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const logEntry = {
        id: logId,
        user_id: userId,
        role: role,
        action: action,
        entity: entity,
        entity_id: entityId,
        prev_value: prevValue,
        new_value: newValue,
        timestamp: new Date()
    };

    try {
        if (db) {
            await db.collection('audit_logs').doc(logId).set(logEntry);
        }
        console.log(`[AUDIT] [${role.toUpperCase()}] ${userId} -> ${action} on ${entity}:${entityId}`);
    } catch (err) {
        console.error('[AUDIT-ERROR] Failed to write log to Firestore:', err);
    }

    return logEntry;
};

const getAdminAuditTrail = async () => {
    if (!db) return [];
    const snapshot = await db.collection('audit_logs').orderBy('timestamp', 'desc').limit(100).get();
    return snapshot.docs.map(doc => doc.data());
};

module.exports = { logAction, getAdminAuditTrail };
